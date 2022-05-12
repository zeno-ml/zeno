import asyncio
import logging
import os
import sys
import threading
from importlib import util
from inspect import getmembers, isfunction, signature
from multiprocessing import Pool
from pathlib import Path
from typing import Callable, Dict, List

import numpy as np
import pandas as pd
import umap  # type: ignore

from .classes import (
    DataLoader,
    ModelLoader,
    Preprocessor,
    Result,
    ResultRequest,
    Slice,
    Slicer,
)
from .util import get_arrow_bytes, preprocess_data, run_inference, slice_data


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

        self.model_loader: ModelLoader = None  # type: ignore
        self.data_loader: DataLoader = None  # type: ignore

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

        self.done_slicing = threading.Event()
        self.done_inference = threading.Event()
        self.complete_columns = list(self.df.columns)

    def start_processing(self):
        """Parse testing files, preprocess, run inference, and slicing data."""
        self.__parse_testing_files()
        self.metadata = [*[p.name for p in self.preprocessors], *list(self.df.columns)]
        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
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
                        self.model_loader = ModelLoader(func_name, test_file)
                    else:
                        logging.error("Multiple model loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func, "load_data"):
                    if self.data_loader is None:
                        self.data_loader = DataLoader(func_name, test_file)
                    else:
                        logging.error("Multiple data loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func, "preprocess"):
                    self.preprocessors.append(Preprocessor(func_name, test_file))
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

    async def __process(self):
        self.status = "Running preprocessing"

        # Check if we need to preprocess since Pool is expensive
        preprocessors_to_run = []
        for preprocessor in self.preprocessors:
            save_path = Path(
                self.cache_path,
                "zenopreprocess_" + preprocessor.name + ".pickle",
            )

            try:
                self.df.loc[:, preprocessor.name] = pd.read_pickle(save_path)
            except FileNotFoundError:
                self.df.loc[:, preprocessor.name] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )

            if self.df[preprocessor.name].isnull().any():
                preprocessors_to_run.append(preprocessor)
            else:
                self.complete_columns.append(preprocessor.name)

        if len(preprocessors_to_run) > 0:
            with Pool() as pool:
                preprocess_outputs = pool.starmap(
                    preprocess_data,
                    [
                        [
                            s,
                            self.df[s.name],
                            self.data_path,
                            self.cache_path,
                            self.df,
                            self.data_loader,
                            self.batch_size,
                            i,
                        ]
                        for i, s in enumerate(self.preprocessors)
                    ],
                )
                for out in preprocess_outputs:
                    self.df.loc[:, out[0]] = out[1]
                    self.complete_columns.append(out[0])

        self.__slice_data()
        self.done_slicing.set()
        self.complete_columns.extend(
            [r for r in self.df.columns if r.startswith("zenoslice_")]
        )

        # Check if we need to run inference since Pool is expensive
        models_to_run = []
        for model_path in self.model_paths:
            model_name = os.path.basename(model_path).split(".")[0]

            inference_save_path = Path(
                self.cache_path,
                "zenomodel_" + model_name + ".pickle",
            )
            embedding_save_path = Path(
                self.cache_path,
                "zenoembedding_" + model_name + ".pickle",
            )

            try:
                self.df.loc[:, "zenomodel_" + model_name] = pd.read_pickle(
                    inference_save_path
                )
            except FileNotFoundError:
                self.df.loc[:, "zenomodel_" + model_name] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )
            try:
                self.df.loc[:, "zenoembedding_" + model_name] = pd.read_pickle(
                    embedding_save_path
                )
            except FileNotFoundError:
                self.df.loc[:, "zenoembedding_" + model_name] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )

            if (
                self.df["zenomodel_" + model_name].isnull().any()
                or self.df["zenoembedding_" + model_name].isnull().any()
            ):
                models_to_run.append(model_path)
            else:
                self.complete_columns.append("zenomodel_" + model_name)

        self.status = "Running inference"
        if len(models_to_run) > 0:
            with Pool() as pool:
                inference_outputs = pool.starmap(
                    run_inference,
                    [
                        [
                            m,
                            self.data_path,
                            self.cache_path,
                            self.df,
                            self.data_loader,
                            self.model_loader,
                            self.batch_size,
                            i,
                        ]
                        for i, m in enumerate(self.model_paths)
                    ],
                )
                for out in inference_outputs:
                    self.df.loc[:, "zenomodel_" + out[0]] = out[1]
                    self.df.loc[:, "zenoembedding_" + out[0]] = out[2]
                    self.complete_columns.append("zenomodel_" + out[0])

        for m in self.model_paths:
            model_name = os.path.basename(m).split(".")[0]
            res = [r for r in self.results.values() if model_name in r.model_names]
            [self.calculate_metrics(r, self.slices[r.sli], model_name) for r in res]

        self.done_inference.set()
        self.status = "Done preprocessing"

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

    def get_results(self, requests: List[ResultRequest]):
        """Calculate result for each requested combination."""

        for request in requests:
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

            if model_name not in res.model_names:
                res.model_names.append(model_name)
            if "zenomodel_" + model_name in self.complete_columns:
                self.calculate_metrics(res, sli, model_name)

        self.status = "Done " + str(hash(str(requests)))

    def calculate_metrics(self, res: Result, sli: Slice, model_name: str):
        metric_func = self.metrics[res.metric]

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

    def __run_umap(self, model):
        embeds = np.stack(self.df["zenoembedding_" + model].to_numpy())
        reducer = umap.UMAP()
        embedding = reducer.fit_transform(embeds)
        self.df.loc[:, "zenoembed_x"] = embedding[:, 0]  # type: ignore
        self.df.loc[:, "zenoembed_y"] = embedding[:, 1]  # type: ignore
        self.complete_columns.append("zenoembed_x")
        self.complete_columns.append("zenoembed_y")
        self.status = "Done projecting"

    def run_projection(self, model):
        self.__run_umap(model)

    def get_table(self, columns):
        """Get the metadata DataFrame for a given slice.

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        return get_arrow_bytes(self.df[columns], self.id_column)
