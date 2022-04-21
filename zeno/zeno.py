import asyncio
import logging
import os
import sys
import threading
from importlib import util
from inspect import getmembers, isfunction, signature
from pathlib import Path
from typing import Callable, Dict, List

import numpy as np

import pandas as pd
import tqdm  # type: ignore
import umap  # type: ignore

from .classes import Preprocessor, Result, ResultRequest, Slice, Slicer
from .util import cached_inference, cached_preprocess, get_arrow_bytes, slice_data


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
        task: str,
        test_files: List[Path],
        models: List[str],
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

        if os.path.isdir(models[0]):
            self.model_paths = [
                os.path.join(models[0], m) for m in os.listdir(models[0])
            ]
        else:
            self.model_paths = models
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.batch_size = batch_size
        self.id_column = id_column
        self.label_column = label_column
        self.data_path = data_path

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
            self.df = pd.read_csv(metadata_path)
        elif metadata_path.suffix == ".parquet":
            self.df = pd.read_parquet(metadata_path)
        else:
            logging.error(
                "Extension of " + metadata_path.suffix + " not one of .csv or .parquet"
            )
            sys.exit(1)
        self.metadata_name = os.path.basename(metadata_path).split(".")[0]
        self.cache_path = os.path.join(cache_path, self.metadata_name)
        os.makedirs(self.cache_path, exist_ok=True)

        self.df[id_column].astype(str)
        self.df.set_index(self.id_column, inplace=True)

        self.metadata: List[str] = []

        self.done_preprocessing = False

    def start_processing(self):
        """Parse testing files, preprocess, run inference, and slicing data."""
        self.__parse_testing_files()
        self.metadata = [*[p.name for p in self.preprocessors], *list(self.df.columns)]
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
        self.__get_model_predictions()
        self.__slice_data()
        self.__done_slicing.set()
        self.done_preprocessing = True

    def __preprocess_data(self):
        """Run preprocessors on every instance."""
        for preprocessor in tqdm.tqdm(self.preprocessors, desc="preprocessors"):
            self.status = "Running preprocessor " + preprocessor.name
            cache_path = Path(
                self.cache_path,
                "zenopreprocess_" + preprocessor.name + ".pickle",
            )

            cached_preprocess(
                self.df,
                preprocessor.name,
                cache_path,
                preprocessor.func,
                self.data_loader,
                self.data_path,
                self.batch_size,
            )

        self.status = "Done preprocessing"

    def __get_model_predictions(self):
        for model_name in tqdm.tqdm(self.model_paths, desc="models"):

            fn = self.model_loader(model_name)

            cached_inference(
                self.df,
                os.path.basename(model_name).split(".")[0],
                self.cache_path,
                fn,
                self.data_loader,
                self.data_path,
                self.batch_size,
            )

    def __slice_data(self):
        """Run slicers to create all slices."""
        self.slices = {}
        for name, slicer in self.slicers.items():
            self.status = "Slicing data for " + name
            self.slices = {
                **self.slices,
                **slice_data(self.df, slicer, self.label_column),
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
        for i, request in enumerate(requests):
            if cancel_event.is_set():
                return

            slice_name, idxs, metric_name, model_name = (
                request.slice_name,
                request.idxs,
                request.metric,
                request.model,
            )
            try:
                sli = self.slices[slice_name]
            except KeyError:
                sli = Slice(slice_name, "generated", pd.Index(idxs))
                self.slices[slice_name] = sli

            self.status = ("Test {0}/{1}: Slice {2}, Metric {3}, Model {4}").format(
                str(i + 1),
                str(len(requests)),
                slice_name,
                metric_name,
                model_name,
            )

            # TODO: add transform
            res_hash = int(hash(slice_name + "" + metric_name) / 10000)

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
                    self.df.loc[sli.index, "zenomodel_" + model_name].tolist(),
                    self.df.loc[sli.index],
                    self.label_column,
                )
            else:
                result = metric_func(
                    self.df.loc[sli.index, "zenomodel_" + model_name].tolist(),
                    self.df.loc[sli.index],
                )

            res.set_result(model_name, result)
            self.results[res.id] = res
        self.status = "Done " + str(hash(str(requests)))

    def get_table(self):
        """Get the metadata DataFrame for a given slice.

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        return get_arrow_bytes(self.df, self.id_column)

    def run_projection(self, model):
        self.status = "Projecting"
        embeds = np.stack(self.df["embed_" + model].to_numpy())
        reducer = umap.UMAP()
        embedding = reducer.fit_transform(embeds)
        self.df["zenoembed_x"] = embedding[:, 0]  # type: ignore
        self.df["zenoembed_y"] = embedding[:, 1]  # type: ignore
        self.status = "Done projecting"
        return "success"
