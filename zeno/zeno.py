import asyncio
import dataclasses
import logging
import os
import sys
import threading
from importlib import util
from inspect import getmembers, isfunction
from multiprocessing import Pool
from pathlib import Path
from typing import Callable, Dict, List

import numpy as np
import pandas as pd
import umap  # type: ignore

from .api import ZenoOptions
from .classes import ModelLoader, Postprocessor, Preprocessor, ResultsRequest, Slice
from .util import get_arrow_bytes, postprocess_data, preprocess_data, run_inference


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
        task: str,
        tests: Path,
        models: List[Path],
        batch_size,
        id_column,
        data_column,
        label_column,
        data_type,
        output_type,
        data_path,
        cache_path: Path,
    ):
        logging.basicConfig(level=logging.INFO)

        self.task = task
        self.tests = tests

        if os.path.isdir(models[0]):
            self.model_paths = [
                os.path.join(models[0], m) for m in os.listdir(models[0])
            ]
        else:
            self.model_paths = models  # type: ignore
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.batch_size = batch_size
        self.id_column = id_column
        self.data_column = data_column
        self.label_column = label_column
        self.data_type = data_type
        self.output_type = output_type
        self.data_path = data_path

        self.zeno_options = ZenoOptions(
            id_column=self.id_column,
            data_column=self.data_column,
            label_column=self.label_column,
            data_path=self.data_path,
            data_type=self.data_type,
            output_type=self.output_type,
            output_column="",
            output_path="",
        )

        self.status: str = "Initializing"

        self.model_loader: ModelLoader = None  # type: ignore

        # Key is name of preprocess function
        self.preprocessors: List[Preprocessor] = []
        # Key is name of preprocess function
        self.postprocessors: List[Postprocessor] = []
        # Key is name of metric function
        self.metrics: Dict[str, Callable] = {}

        # Key is name of slice
        self.slices: Dict[str, Slice] = {}

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
        self.df[id_column] = self.df.index

        self.metadata: List[str] = []

        self.done_inference = threading.Event()
        self.complete_columns = list(self.df.columns)

    def start_processing(self):
        """Parse testing files, preprocess, run inference, and slicing data."""
        self.__parse_testing_files()

        meta = [
            *["zenopre_" + p.name for p in self.preprocessors],
            *list(self.df.columns),
        ]
        for post in self.postprocessors:
            for model in self.model_names:
                meta.append("zenopost_" + model + "_" + post.name)
        self.metadata = meta

        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
        self.__thread.start()

    def __parse_testing_files(self):
        self.data_loader = None  # type: ignore
        self.model_loader = None  # type: ignore
        self.slicers = {}
        self.metrics = {}

        [
            self.__parse_testing_file(f, self.tests)
            for f in list(self.tests.rglob("*.py"))
        ]

        if not self.model_loader:
            logging.error("No model loader found")
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
                if hasattr(func, "preprocess"):
                    self.preprocessors.append(Preprocessor(func_name, test_file))
                if hasattr(func, "postprocess"):
                    self.postprocessors.append(Postprocessor(func_name, test_file))
                if hasattr(func, "metric"):
                    self.metrics[func_name] = func

    async def __process(self):
        self.status = "Running preprocessing"

        # Check if we need to preprocess since Pool is expensive
        preprocessors_to_run = []
        for preprocessor in self.preprocessors:
            col_name = "zenopre_" + preprocessor.name
            save_path = Path(self.cache_path, col_name + ".pickle")

            try:
                self.df.loc[:, col_name] = pd.read_pickle(save_path)
            except FileNotFoundError:
                self.df.loc[:, col_name] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )

            if self.df[col_name].isnull().any():
                preprocessors_to_run.append(preprocessor)
            else:
                self.complete_columns.append(col_name)

        if len(preprocessors_to_run) > 0:
            with Pool() as pool:
                preprocess_outputs = pool.starmap(
                    preprocess_data,
                    [
                        [
                            s,
                            self.zeno_options,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, s in enumerate(self.preprocessors)
                    ],
                )
                for out in preprocess_outputs:
                    self.df.loc[:, out[0]] = out[1]
                    self.complete_columns.append(out[0])

        # Check if we need to run inference since Pool is expensive
        models_to_run = []
        for model_path in self.model_paths:
            model_name = os.path.basename(model_path).split(".")[0]
            col_name_model = "zenomodel_" + model_name
            col_name_embedding = "zenoembedding_" + model_name

            inference_save_path = Path(self.cache_path, col_name_model + ".pickle")
            embedding_save_path = Path(self.cache_path, col_name_embedding + ".pickle")

            try:
                self.df.loc[:, col_name_model] = pd.read_pickle(inference_save_path)
            except FileNotFoundError:
                self.df.loc[:, col_name_model] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )
            try:
                self.df.loc[:, col_name_embedding] = pd.read_pickle(embedding_save_path)
            except FileNotFoundError:
                self.df.loc[:, col_name_embedding] = pd.Series(
                    [pd.NA] * self.df.shape[0], index=self.df.index
                )

            if (
                self.df[col_name_model].isnull().any()
                or self.df[col_name_embedding].isnull().any()
            ):
                models_to_run.append(model_path)
            else:
                self.complete_columns.append(col_name_model)

        self.status = "Running inference"
        if len(models_to_run) > 0:
            with Pool() as pool:
                inference_outputs = pool.starmap(
                    run_inference,
                    [
                        [
                            self.model_loader,
                            self.zeno_options,
                            m,
                            self.cache_path,
                            self.df,
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

        self.done_inference.set()
        self.status = "Done running inference"

        # Check if we need to run postprocessing since Pool is expensive
        post_to_run = []
        for postprocessor in self.postprocessors:
            for model in self.model_names:
                col_name = "zenopost_" + model + "_" + postprocessor.name
                save_path = Path(self.cache_path, col_name + ".pickle")

                try:
                    self.df.loc[:, col_name] = pd.read_pickle(save_path)
                except FileNotFoundError:
                    self.df.loc[:, col_name] = pd.Series(
                        [pd.NA] * self.df.shape[0], index=self.df.index
                    )

                if self.df[col_name].isnull().any():
                    post_to_run.append((postprocessor, model))
                else:
                    self.complete_columns.append(col_name)

        self.status = "Running postprocessing"
        if len(post_to_run) > 0:
            with Pool() as pool:
                post_outputs = pool.starmap(
                    postprocess_data,
                    [
                        [
                            e[0],
                            e[1],
                            self.zeno_options,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, e in enumerate(post_to_run)
                    ],
                )
                for out in post_outputs:
                    self.df.loc[:, "zenopost_" + out[0]] = out[1]
                    self.complete_columns.append("zenopost_" + out[0])

        self.done_inference.set()
        self.status = "Done running postprocessing"

    def get_results(self, requests: ResultsRequest):
        """Calculate result for each requested combination."""

        return_metrics = []
        for request in requests.requests:
            for metric_name in self.metrics.keys():
                for model_name in self.model_names:
                    return_metrics.append(
                        self.calculate_metrics(
                            request.idxs, request.sli, metric_name, model_name
                        )
                    )

        return return_metrics

    def calculate_metrics(
        self, idxs: List, name: str, metric_name: str, model_name: str
    ):
        if "zenomodel_" + model_name not in self.df.columns:
            return

        local_ops = dataclasses.replace(
            self.zeno_options, output_column="zenomodel_" + model_name
        )
        metric_func = self.metrics[metric_name]
        result_metric = metric_func(self.df.loc[idxs], local_ops)

        return {
            "slice": name,
            "model": model_name,
            "metric": metric_name,
            "value": result_metric,
        }

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
