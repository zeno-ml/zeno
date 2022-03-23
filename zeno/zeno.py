import asyncio
import os
import sys
import threading
from importlib import util
from inspect import getmembers, isfunction, signature
from pathlib import Path
from typing import Callable, Dict, List

import pandas as pd

from .classes import Preprocessor, Result, ResultRequest, Slice, Slicer
from .util import cached_process, get_arrow_bytes


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
        test_files: List[Path],
        models: List[Path],
        batch_size=16,
        id_column="id",
        label_column="label",
        data_path="",
        cache_path="",
    ):
        self.metadata_path = metadata_path
        self.test_files = test_files
        self.model_names = models
        self.batch_size = batch_size
        self.id_column = id_column
        self.label_column = label_column
        self.data_path = data_path
        self.cache_path = cache_path
        os.makedirs(self.cache_path, exist_ok=True)

        self.status: str = "Initializing"

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
            print(
                "ERROR: extension of "
                + metadata_path.suffix
                + " not one of .csv or .parquet"
            )

        self.metadata[id_column].astype(str)
        self.metadata.set_index(self.id_column, inplace=True)

    def start_processing(self):
        self.__parse_testing_files()
        self.__run_tests()

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
            print("ERROR: No model loader found")
            sys.exit(1)

        if not self.data_loader:
            print("ERROR: No data loader found")
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
                        print("Multiple model loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func, "load_data"):
                    if self.data_loader is None:
                        self.data_loader = func
                    else:
                        print("Multiple data loaders found, can only have one")
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

    def __run_tests(self):
        # TODO: listen for interruption, stop processing and run again.
        _thread = threading.Thread(
            target=asyncio.run, args=(self.__run_test_pipeline(),)
        )
        _thread.start()

    def __run_analysis(self, reqs: List[ResultRequest]):
        # TODO: listen for interruption, stop processing and run again.
        _thread = threading.Thread(
            target=asyncio.run, args=(self.__calculate_metrics(reqs),)
        )
        _thread.start()

    # def __run_one_test(self):

    async def __run_test_pipeline(self):
        self.__preprocess_data()
        self.__slice_data()
        reqs: List[ResultRequest] = []
        for s in self.slices.values():
            for met in self.metrics.keys():
                reqs.append(
                    ResultRequest(slices=s.name, metric=met, model="", transform="")
                )
        await self.__calculate_metrics(reqs)

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
            cached_process(
                self.metadata,
                self.metadata.index,
                preprocessor.name,
                cache_path,
                preprocessor.func,
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
                **slicer.slice_data(self.metadata, self.label_column),
            }
        self.status = "Done slicing"

    async def __calculate_metrics(self, requests: List[ResultRequest]):
        """Calculate result for each requested combination."""
        requests_all_models = []
        for r in requests:
            requests_all_models.extend(
                [
                    ResultRequest(
                        slices=r.slices, metric=r.metric, model=str(m), transform=""
                    )
                    for m in self.model_names
                ]
            )
        requests = requests_all_models

        self.status = "working"
        for i, request in enumerate(requests):
            slice_name, metric_name, model_name = (
                request.slices,
                request.metric,
                request.model,
            )
            try:
                sli = self.slices["".join(["".join(d) for d in slice_name])]
            except KeyError:
                index = self.slices["".join(slice_name[0])].sliced_indices.intersection(
                    self.slices["".join(slice_name[1])].sliced_indices
                )
                sli = Slice(slice_name, index, len(index), "")
                self.slices["".join(["".join(d) for d in slice_name])] = sli

            self.status = ("Test {0}/{1}: Slice {2}, Metric {3}, Model {4}").format(
                str(i + 1),
                str(len(requests)),
                slice_name,
                metric_name,
                model_name,
            )

            self.__calculate_outputs(sli)

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
                    self.model_names,
                )

            metric_func = self.metrics[metric_name]

            if len(signature(metric_func).parameters) == 3:
                result = metric_func(
                    self.metadata.loc[sli.sliced_indices, str(model_name)].tolist(),
                    self.metadata.loc[sli.sliced_indices],
                    self.label_column,
                )
            else:
                result = metric_func(
                    self.metadata.loc[sli.sliced_indices, str(model_name)].tolist(),
                    self.metadata.loc[sli.sliced_indices],
                )

            res.set_result(model_name, result)
            self.results[res.id] = res
        self.status = "Done " + str(hash(str(requests)))

    def __calculate_outputs(self, sli: Slice):
        """Calculate model outputs for each slice."""
        for i, model_name in enumerate(self.model_names):
            self.status = "Loading model {0}, {1}/{2}".format(
                model_name, str(i + 1), str(len(self.model_names))
            )
            model = self.model_loader(model_name)

            cached_process(
                self.metadata,
                sli.sliced_indices,
                str(model_name),
                Path(
                    self.cache_path,
                    "model_"
                    + str(model_name).replace("/", "_")
                    + "_"
                    + str(self.metadata_path).replace("/", "_"),
                ),
                model,
                self.data_loader,
                self.data_path,
                self.batch_size,
            )

    def get_table(self, sli: str):
        """Get the metadata DataFrame for a given slice.

        Args:
            sli (str): Name of the slice

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        name = "".join(["".join(d) for d in sli])
        df = self.metadata.loc[self.slices[name].sliced_indices]
        return get_arrow_bytes(df)

    def get_result(self, requests: List[ResultRequest]):
        """Start processing for given slices, metrics, and models."""
        self.__run_analysis(requests)
        return "running analysis"
