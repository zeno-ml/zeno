import asyncio
import dataclasses
import logging
import os
import pickle
import sys
import threading
from importlib import util
from inspect import getmembers, getsource, isfunction
from multiprocessing import Pool
from pathlib import Path
from typing import Callable, Dict, List

import numpy as np
import pandas as pd
import umap  # type: ignore

from .api import ZenoOptions
from .classes import (
    DistillFunction,
    PredictFunction,
    Report,
    ReportsRequest,
    ResultsRequest,
    Slice,
)
from .util import (
    get_arrow_bytes,
    load_series,
    postdistill_data,
    predistill_data,
    run_inference,
)


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
        data_path,
        label_path,
        cache_path: Path,
    ):
        logging.basicConfig(level=logging.INFO)

        self.task = task
        self.tests = tests
        self.batch_size = batch_size
        self.id_column = id_column
        self.data_column = data_column
        self.label_column = label_column
        self.data_path = data_path
        self.label_path = label_path

        # Options passed to Zeno functions.
        self.zeno_options = ZenoOptions(
            id_column=self.id_column,
            data_column=self.data_column,
            label_column=self.label_column,
            data_path=self.data_path,
            label_path=self.label_path,
            output_column="",
            output_path="",
        )

        if os.path.isdir(models[0]):
            self.model_paths = [
                os.path.join(models[0], m) for m in os.listdir(models[0])
            ]
        else:
            self.model_paths = models  # type: ignore
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.status: str = "Initializing"

        self.predict_function: PredictFunction = PredictFunction("", Path(""))
        self.distill_functions: List[DistillFunction] = []
        # Key is name of metric function
        self.metric_functions: Dict[str, Callable] = {}

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
        # TODO: figure out if this breaks for big integers. Need to do this for
        # frontend bigint issues.
        d = dict.fromkeys(self.df.select_dtypes(np.int64).columns, np.int32)
        self.df = self.df.astype(d)

        self.metadata_name = os.path.basename(metadata_path).split(".")[0]
        self.cache_path = cache_path
        os.makedirs(self.cache_path, exist_ok=True)

        self.slices: Dict[str, Slice] = {}
        try:
            with open(os.path.join(self.cache_path, "slices.pickle"), "rb") as f:
                self.slices = pickle.load(f)
        except FileNotFoundError:
            pass
        self.reports: List[Report] = []
        try:
            with open(os.path.join(self.cache_path, "reports.pickle"), "rb") as f:
                self.reports = pickle.load(f)
        except FileNotFoundError:
            pass

        self.df[id_column].astype(str)
        self.df.set_index(self.id_column, inplace=True)
        self.df[id_column] = self.df.index

        self.columns: List[str] = []
        self.complete_columns = list(self.df.columns)

        self.done_processing = False

    def start_processing(self):
        """Parse testing files, distill, and run inference."""

        # Get Zeno test functions.
        self.__parse_testing_files()

        # Get names of all columns before processing.
        distill_fn_cols = []
        for fn in self.distill_functions:
            fn_type = fn.fn_type
            if fn_type == "pre":
                distill_fn_cols.append("zenopre_" + fn.name)
            else:
                for m in self.model_names:
                    distill_fn_cols.append("zenopost_" + m + "_" + fn.name)

        self.columns = [*distill_fn_cols, *list(self.df.columns)]

        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
        self.__thread.start()

    def __parse_testing_files(self):
        for f in list(self.tests.rglob("*.py")):
            self.__parse_testing_file(f)

        if self.predict_function.name == "":
            logging.error("No prediction_function found.")
            sys.exit(1)

    def __parse_testing_file(self, test_file: Path):
        spec = util.spec_from_file_location("module.name", test_file)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore

        for func_name, func in getmembers(test_module):
            if isfunction(func):
                if hasattr(func, "predict_function"):
                    if self.predict_function.name == "":
                        self.predict_function = PredictFunction(func_name, test_file)
                    else:
                        logging.error(
                            "Multiple prediction_functions found, can only have one"
                        )
                        sys.exit(1)
                if hasattr(func, "distill_function"):
                    # TODO: find pre vs. post distill functions
                    src = getsource(func)
                    fn_type = "post" if "output_column" in src else "pre"
                    self.distill_functions.append(
                        DistillFunction(func_name, test_file, fn_type)
                    )
                if hasattr(func, "metric_function"):
                    self.metric_functions[func_name] = func

    async def __process(self):
        self.status = "Running preprocessing"

        # Check if we need to preprocess since Pool is expensive
        predistill_to_run = []
        for distill_fn in [f for f in self.distill_functions if f.fn_type == "pre"]:
            col_name = "zenopre_" + distill_fn.name
            save_path = Path(self.cache_path, col_name + ".pickle")

            load_series(self.df, col_name, save_path)

            if self.df[col_name].isnull().any():
                predistill_to_run.append(distill_fn)
            else:
                self.complete_columns.append(col_name)

        if len(predistill_to_run) > 0:
            with Pool() as pool:
                predistill_outputs = pool.starmap(
                    predistill_data,
                    [
                        [
                            s,
                            self.zeno_options,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, s in enumerate(predistill_to_run)
                    ],
                )
                for out in predistill_outputs:
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

            load_series(self.df, col_name_model, inference_save_path)
            load_series(self.df, col_name_embedding, embedding_save_path)

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
                            self.predict_function,
                            self.zeno_options,
                            m,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, m in enumerate(models_to_run)
                    ],
                )
                for out in inference_outputs:
                    self.df.loc[:, "zenomodel_" + out[0]] = out[1]
                    self.df.loc[:, "zenoembedding_" + out[0]] = out[2]
                    self.complete_columns.append("zenomodel_" + out[0])

        self.status = "Done running inference"

        # Check if we need to run postprocessing since Pool is expensive
        postdistill_to_run = []
        for distill_fn in [fn for fn in self.distill_functions if fn.fn_type == "post"]:
            for model in self.model_names:
                col_name = "zenopost_" + model + "_" + distill_fn.name
                save_path = Path(self.cache_path, col_name + ".pickle")

                load_series(self.df, col_name, save_path)

                if self.df[col_name].isnull().any():
                    postdistill_to_run.append((distill_fn, model))
                else:
                    self.complete_columns.append(col_name)

        self.status = "Running postprocessing"
        if len(postdistill_to_run) > 0:
            with Pool() as pool:
                post_outputs = pool.starmap(
                    postdistill_data,
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
                        for i, e in enumerate(postdistill_to_run)
                    ],
                )
                for out in post_outputs:
                    self.df.loc[:, "zenopost_" + out[0]] = out[1]
                    self.complete_columns.append("zenopost_" + out[0])

        self.status = "Done running postprocessing"
        self.done_processing = True

    def get_results(self, requests: ResultsRequest):
        """Calculate result for each requested combination."""

        return_metrics = []
        for sli in requests.slices:
            for metric_name in self.metric_functions.keys():
                for model_name in self.model_names:
                    return_metrics.append(
                        self.calculate_metrics(sli, metric_name, model_name)
                    )

        return return_metrics

    def calculate_metrics(self, sli: Slice, metric_name: str, model_name: str):
        if not self.done_processing:
            return

        local_ops = dataclasses.replace(
            self.zeno_options,
            output_column="zenomodel_" + model_name,
            output_path=os.path.join(self.cache_path, "zenomodel_" + model_name),
        )
        metric_func = self.metric_functions[metric_name]
        result_metric = metric_func(self.df.loc[sli.idxs], local_ops)

        if len(sli.slice_name) > 0:
            self.slices[sli.slice_name] = sli
            with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
                pickle.dump(self.slices, f)

        return {
            "slice": sli.slice_name,
            "model": model_name,
            "metric": metric_name,
            "value": result_metric,
        }

    def get_reports(self):
        return [r.dict(by_alias=True) for r in self.reports]

    def update_reports(self, reports: ReportsRequest):
        """Update reports with results."""
        self.reports = reports.reports
        with open(os.path.join(self.cache_path, "reports.pickle"), "wb") as f:
            pickle.dump(self.reports, f)

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

    def get_slices(self):
        return [s.dict(by_alias=True) for s in self.slices.values()]

    def delete_slice(self, slice_id):
        self.slices.pop(slice_id)
        with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
            pickle.dump(self.slices, f)
