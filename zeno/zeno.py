import asyncio
import logging
import os
import sys
import threading
from importlib import util
from inspect import getmembers, isfunction, signature
from pathlib import Path
from typing import Callable, Dict, List

import pandas as pd

from .classes import Preprocessor, Result, ResultRequest, Slice, Slicer
from .util import cached_process, get_arrow_bytes, slice_data


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
        task: str,
        test_files: List[Path],
        models: List[Path],
        batch_size=16,
        id_column="id",
        label_column="label",
        data_path="",
        cache_path="",
    ):
        logging.basicConfig(level=logging.INFO)
        self.metadata_path = metadata_path
        self.task = task
        self.test_files = test_files
        self.model_names = models
        self.batch_size = batch_size
        self.id_column = id_column
        self.label_column = label_column
        self.data_path = data_path
        self.cache_path = cache_path
        os.makedirs(self.cache_path, exist_ok=True)

        self.status: str = "Initializing"
        self.__done_slicing = threading.Event()
        self.__cancel_event = threading.Event()

        self.model_loader: Callable = None  # type: ignore
        self.data_loader: Callable = None  # type: ignore

        # Key is name of preprocess function
        self.preprocessors: List[Preprocessor] = []
        # Key is name of slicer function
        self.slicers: Dict[str, Slicer] = {}
        # Key is name of transform function
        self.transforms: Dict[str, Callable] = {}
        # Key is name of metric function
        self.metrics: Dict[str, Callable] = {}

        # Key is name of slice
        self.slices: Dict[str, Slice] = {}
        # Key is result.id, hash of properties
        self.results: Dict[int, Result] = {}

        # Read metadata as Pandas for slicing
        if metadata_path.suffix == ".csv":
            self.metadata = pd.read_csv(metadata_path)
        elif metadata_path.suffix == ".parquet":
            self.metadata = pd.read_parquet(metadata_path)
        else:
            logging.error(
                "Extension of " + metadata_path.suffix + " not one of .csv or .parquet"
            )
            sys.exit(1)

        self.metadata[id_column].astype(str)
        self.metadata.set_index(self.id_column, inplace=True)

    def start_processing(self):
        """Parse testing files and start preprocessing and slicing data."""
        self.__parse_testing_files()
        self.__thread = threading.Thread(
            target=asyncio.run, args=(self.__preprocess_and_slice(),)
        )
        self.__thread.start()

    def __parse_testing_files(self):
        self.data_loader = None  # type: ignore
        self.model_loader = None  # type: ignore
        self.slicers = {}
        self.metrics = {}
        self.transforms = {}

        for test_file in self.test_files:
            if test_file.is_dir():
                [
                    self.__parse_testing_file(f, test_file)
                    for f in list(test_file.rglob("*.py"))
                ]
            else:
                self.__parse_testing_file(test_file, test_file.parents[0])

        if not self.model_loader:
            logging.error("No model loader found")
            sys.exit(1)

        if not self.data_loader:
            logging.error("No data loader found")
            sys.exit(1)

    def __parse_testing_file(self, test_file: Path, base_path: Path):
        spec = util.spec_from_file_location("module.name", test_file)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore

        for func_name, func in getmembers(test_module):
            if isfunction(func):
                if hasattr(func, "load_model"):
                    if self.model_loader is None:
                        self.model_loader = func
                    else:
                        logging.error("Multiple model loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func, "load_data"):
                    if self.data_loader is None:
                        self.data_loader = func
                    else:
                        logging.error("Multiple data loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func, "preprocess"):
                    self.preprocessors.append(Preprocessor(func_name, func))
                if hasattr(func, "slicer"):
                    path_names = list(test_file.relative_to(base_path).parts)
                    path_names[-1] = path_names[-1][0:-3]
                    self.slicers[func_name] = Slicer(
                        func_name,
                        func,
                        [*path_names, func_name],
                    )
                if hasattr(func, "transform"):
                    self.transforms[func_name] = func
                if hasattr(func, "metric"):
                    self.metrics[func_name] = func

    async def __preprocess_and_slice(self):
        self.__preprocess_data()
        self.__slice_data()
        self.__done_slicing.set()

    def __preprocess_data(self):
        """Run preprocessors on every instance."""
        for preprocessor in self.preprocessors:
            self.status = "Running preprocessor " + preprocessor.name
            cache_path = Path(
                self.cache_path,
                "preprocess_"
                + preprocessor.name
                + "_"
                + str(self.metadata_path).replace("/", "_"),
            )

            def fn_loader():
                return preprocessor.func

            cached_process(
                self.metadata,
                self.metadata.index,
                preprocessor.name,
                cache_path,
                fn_loader,
                self.data_loader,
                self.data_path,
                self.batch_size,
            )
        self.status = "Done preprocessing"

    def __slice_data(self):
        """Run slicers to create all slices."""
        self.slices = {}
        for name, slicer in self.slicers.items():
            self.status = "Slicing data for " + name
            self.slices = {
                **self.slices,
                **slice_data(self.metadata, slicer, self.label_column),
            }
        self.status = "Done slicing"

    def run_analysis(self, reqs: List[ResultRequest]):
        if self.__cancel_event:
            self.__cancel_event.set()
            self.__thread.join()
        self.__cancel_event = threading.Event()
        self.__thread = threading.Thread(
            target=asyncio.run,
            args=(self.__calculate_metrics(reqs, self.__cancel_event),),
        )
        self.__thread.start()

    async def __calculate_metrics(
        self, requests: List[ResultRequest], cancel_event: threading.Event
    ):
        """Calculate result for each requested combination."""
        self.__done_slicing.wait()

        self.status = "working"
        # TODO: sort by model to decrease model loads -
        # or save models in memory? CUDA considerations?
        for i, request in enumerate(requests):
            if cancel_event.is_set():
                return

            slice_name, metric_name, model_name = (
                request.slices,
                request.metric,
                request.model,
            )
            try:
                sli = self.slices["".join(["".join(d) for d in slice_name])]
            except KeyError:
                index = self.slices["".join(slice_name[0])].index.intersection(
                    self.slices["".join(slice_name[1])].index
                )
                sli = Slice(slice_name, index)
                self.slices["".join(["".join(d) for d in slice_name])] = sli

            self.status = ("Test {0}/{1}: Slice {2}, Metric {3}, Model {4}").format(
                str(i + 1),
                str(len(requests)),
                slice_name,
                metric_name,
                model_name,
            )
            self.__calculate_outputs(sli, model_name)

            res_hash = int(
                hash("".join(["".join(d) for d in slice_name]) + "" + metric_name)
                / 10000
            )
            if res_hash in self.results:
                res = self.results[res_hash]
            else:
                res = Result(
                    slice_name,
                    "",
                    metric_name,
                    sli.size,
                )

            metric_func = self.metrics[metric_name]

            if len(signature(metric_func).parameters) == 3:
                result = metric_func(
                    self.metadata.loc[sli.index, str(model_name)].tolist(),
                    self.metadata.loc[sli.index],
                    self.label_column,
                )
            else:
                result = metric_func(
                    self.metadata.loc[sli.index, str(model_name)].tolist(),
                    self.metadata.loc[sli.index],
                )

            res.set_result(model_name, result)
            self.results[res.id] = res
        self.status = "Done " + str(hash(str(requests)))

    def __calculate_outputs(self, sli: Slice, model_name: str):
        """Calculate model outputs for each slice."""

        def fn_loader():
            return self.model_loader(model_name)

        cached_process(
            self.metadata,
            sli.index,
            str(model_name),
            Path(
                self.cache_path,
                "model_"
                + str(model_name).replace("/", "_")
                + "_"
                + str(self.metadata_path).replace("/", "_"),
            ),
            fn_loader,
            self.data_loader,
            self.data_path,
            self.batch_size,
        )

    def get_table(self):
        """Get the metadata DataFrame for a given slice.

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        return get_arrow_bytes(self.metadata, self.id_column)
