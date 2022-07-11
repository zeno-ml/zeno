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
from typing import Dict, List

import numpy as np
import pandas as pd
import umap  # type: ignore

from .api import ZenoOptions
from .classes import (
    MetricKey,
    MetricsRequest,
    Report,
    ReportsRequest,
    Slice,
    ZenoColumn,
    ZenoColumnType,
    ZenoFunction,
    ZenoFunctionType,
)
from .util import (
    get_arrow_bytes,
    get_function,
    load_series,
    postdistill_data,
    predistill_data,
    run_inference,
    transform_data,
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
        self.id_column = ZenoColumn(column_type=ZenoColumnType.METADATA, name=id_column)
        self.data_column = ZenoColumn(
            column_type=ZenoColumnType.METADATA, name=data_column
        )
        self.label_column = ZenoColumn(
            column_type=ZenoColumnType.METADATA, name=label_column
        )
        self.data_path = data_path
        self.label_path = label_path

        # Options passed to Zeno functions.
        self.zeno_options = ZenoOptions(
            id_column=str(self.id_column),
            data_column=str(self.data_column),
            label_column=str(self.label_column),
            data_path=self.data_path,
            label_path=self.label_path,
            output_column="",
            output_path="",
        )

        if models and os.path.isdir(models[0]):
            self.model_paths = [
                os.path.join(models[0], m) for m in os.listdir(models[0])
            ]
        else:
            self.model_paths = models  # type: ignore
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.status: str = "Initializing"

        self.predict_function: ZenoFunction = ZenoFunction(
            name="", file_name=Path(""), fn_type=ZenoFunctionType.PREDICTION
        )
        self.distill_functions: Dict[str, ZenoFunction] = {}
        self.metric_functions: Dict[str, ZenoFunction] = {}
        self.transform_functions: Dict[str, ZenoFunction] = {}

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

        self.df = self.df.rename(columns=lambda x: "0" + str(x))
        self.df[str(self.id_column)].astype(str)
        self.df.set_index(str(self.id_column), inplace=True)
        self.df[str(self.id_column)] = self.df.index

        self.columns: List[ZenoColumn] = []
        self.complete_columns: List[ZenoColumn] = []

        self.done_processing = False

    def start_processing(self):
        """Parse testing files, distill, and run inference."""

        # Get all Zeno core columns before processing.
        zeno_cols: List[ZenoColumn] = []
        for metadata_col in self.df.columns:
            col = ZenoColumn(column_type=ZenoColumnType.METADATA, name=metadata_col[1:])
            zeno_cols.append(col)
            self.complete_columns.append(col)

        # Get Zeno test functions.
        if not self.tests:
            self.columns = zeno_cols
            self.done_processing = True
            self.status = "Done processing"
            return

        for f in list(self.tests.rglob("*.py")):
            self.__parse_testing_file(f)

        for fn in self.distill_functions.values():
            if fn.fn_type == ZenoFunctionType.PREDISTILL:
                zeno_cols.append(
                    ZenoColumn(column_type=ZenoColumnType.PREDISTILL, name=fn.name)
                )
            else:
                for m in self.model_names:
                    zeno_cols.append(
                        ZenoColumn(
                            column_type=ZenoColumnType.POSTDISTILL,
                            name=fn.name,
                            model=m,
                        )
                    )

        self.columns = zeno_cols

        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
        self.__thread.start()

    def __parse_testing_file(self, test_file: Path):
        spec = util.spec_from_file_location("module.name", test_file)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore

        for func_name, func in getmembers(test_module):
            if isfunction(func):
                if hasattr(func, "predict_function"):
                    if self.predict_function.name == "":
                        self.predict_function = ZenoFunction(
                            name=func_name,
                            file_name=test_file,
                            fn_type=ZenoFunctionType.PREDICTION,
                        )
                    else:
                        logging.error(
                            "Multiple prediction_functions found, can only have one"
                        )
                        sys.exit(1)
                if hasattr(func, "distill_function"):
                    src = getsource(func)
                    self.distill_functions[func_name] = ZenoFunction(
                        name=func_name,
                        file_name=test_file,
                        fn_type=(
                            ZenoFunctionType.POSTDISTILL
                            if "output_column" in src
                            else ZenoFunctionType.PREDISTILL
                        ),
                    )
                if hasattr(func, "transform_function"):
                    self.transform_functions[func_name] = ZenoFunction(
                        name=func_name,
                        file_name=test_file,
                        fn_type=ZenoFunctionType.TRANSFORM,
                    )
                if hasattr(func, "metric_function"):
                    self.metric_functions[func_name] = ZenoFunction(
                        name=func_name,
                        file_name=test_file,
                        fn_type=ZenoFunctionType.METRIC,
                    )

    async def __process(self):
        self.status = "Running distill functions"
        self.__predistill()
        self.status = "Running transform functions"
        self.__transform()

        for transform in [
            *self.transform_functions.values(),
            ZenoFunction(
                name="", file_name=Path(""), fn_type=ZenoFunctionType.TRANSFORM
            ),
        ]:
            self.__inference_and_postdistill(transform)

        self.done_processing = True

    def __transform(self):
        """Run transform functions."""
        transform_to_run: List[ZenoFunction] = []
        for transform_function in self.transform_functions.values():
            transform_column = ZenoColumn(
                column_type=ZenoColumnType.TRANSFORM, name=transform_function.name
            )
            save_path = Path(self.cache_path, str(transform_column) + ".pickle")

            load_series(self.df, str(transform_column), save_path)

            if self.df[str(transform_column)].isnull().any():
                transform_to_run.append(transform_function)
            else:
                self.complete_columns.append(transform_column)

        if len(transform_to_run) > 0:
            with Pool() as pool:
                transform_outputs = pool.starmap(
                    transform_data,
                    [
                        [
                            transform_fn,
                            self.zeno_options,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, transform_fn in enumerate(transform_to_run)
                    ],
                )
                for out in transform_outputs:
                    self.df.loc[:, str(out[0])] = out[1]
                    self.complete_columns.append(out[0])

    def __predistill(self):
        """Run distilling functions not dependent on model outputs."""
        # Check if we need to preprocess since Pool is expensive
        predistill_to_run: List[ZenoColumn] = []
        for predistill_column in [
            c for c in self.columns if c.column_type == ZenoColumnType.PREDISTILL
        ]:
            save_path = Path(self.cache_path, str(predistill_column) + ".pickle")

            load_series(self.df, str(predistill_column), save_path)

            if self.df[str(predistill_column)].isnull().any():
                predistill_to_run.append(predistill_column)
            else:
                self.complete_columns.append(predistill_column)

        if len(predistill_to_run) > 0:
            with Pool() as pool:
                predistill_outputs = pool.starmap(
                    predistill_data,
                    [
                        [
                            self.distill_functions[col.name],
                            col,
                            self.zeno_options,
                            self.cache_path,
                            self.df,
                            self.batch_size,
                            i,
                        ]
                        for i, col in enumerate(predistill_to_run)
                    ],
                )
                for out in predistill_outputs:
                    self.df.loc[:, str(out[0])] = out[1]
                    self.complete_columns.append(out[0])

    def __inference_and_postdistill(self, transform: ZenoFunction):
        # Check if we need to run inference since Pool is expensive
        models_to_run = []
        for model_path in self.model_paths:
            model_name = os.path.basename(model_path).split(".")[0]
            model_column = ZenoColumn(
                column_type=ZenoColumnType.OUTPUT,
                name=model_name,
                transform=transform.name,
            )
            embedding_column = ZenoColumn(
                column_type=ZenoColumnType.EMBEDDING,
                name=model_name,
                transform=transform.name,
            )
            model_hash = str(model_column)
            embedding_hash = str(embedding_column)

            model_save_path = Path(self.cache_path, model_hash + ".pickle")
            embedding_save_path = Path(self.cache_path, embedding_hash + ".pickle")

            load_series(self.df, model_hash, model_save_path)
            load_series(self.df, embedding_hash, embedding_save_path)

            if (
                self.df[model_hash].isnull().any()
                or self.df[embedding_hash].isnull().any()
            ):
                models_to_run.append(model_path)
            else:
                self.complete_columns.append(model_column)

        self.status = "Running inference"
        if len(models_to_run) > 0:
            with Pool() as pool:
                inference_outputs = pool.starmap(
                    run_inference,
                    [
                        [
                            self.predict_function,
                            self.zeno_options,
                            transform.name,
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
                    self.df.loc[:, str(out[0])] = out[2]
                    self.df.loc[:, str(out[1])] = out[3]
                    self.complete_columns.append(out[0])

        self.status = "Done running inference"

        # Check if we need to run postprocessing since Pool is expensive
        postdistill_to_run: List[ZenoColumn] = []
        for postdistill_column in [
            c for c in self.columns if c.column_type == ZenoColumnType.POSTDISTILL
        ]:
            col_name = postdistill_column.copy(
                update={"model": postdistill_column.model, "transform": transform.name}
            )
            col_hash = str(col_name)
            save_path = Path(self.cache_path, col_hash + ".pickle")

            load_series(self.df, col_hash, save_path)

            if self.df[col_hash].isnull().any():
                postdistill_to_run.append(col_name)
            else:
                self.complete_columns.append(col_name)

        self.status = "Running postprocessing"
        if len(postdistill_to_run) > 0:
            with Pool() as pool:
                post_outputs = pool.starmap(
                    postdistill_data,
                    [
                        [
                            self.distill_functions[e.name],
                            e.model,
                            transform.name,
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
                    self.df.loc[:, str(out[0])] = out[1]
                    self.complete_columns.append(out[0])

        self.status = "Done running postprocessing"

    def get_results(self, request: MetricsRequest):
        """Calculate result for each requested combination."""

        return_metrics = []
        for metric_key in request.requests:
            return_metrics.append(self.calculate_metrics(metric_key))

        return return_metrics

    def calculate_metrics(self, metric_key: MetricKey):
        if not self.done_processing:
            return

        sli = metric_key.sli
        output_col = ZenoColumn(
            column_type=ZenoColumnType.OUTPUT,
            name=metric_key.model,
            transform=metric_key.transform,
        )
        output_hash = str(output_col)

        local_ops = dataclasses.replace(
            self.zeno_options,
            output_column=output_hash,
            output_path=os.path.join(self.cache_path, output_hash),
        )
        if sli.idxs and len(sli.idxs) > 0:
            metric_func = get_function(self.metric_functions[metric_key.metric])
            result_metric = metric_func(self.df.loc[sli.idxs], local_ops)
        else:
            result_metric = None

        if len(sli.slice_name) > 0 and sli.idxs and len(sli.idxs) != len(self.df):
            self.slices[sli.slice_name] = sli
            with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
                pickle.dump(self.slices, f)

        return result_metric

    def get_reports(self):
        return [r.dict(by_alias=True) for r in self.reports]

    def update_reports(self, reports: ReportsRequest):
        """Update reports with results."""
        self.reports = reports.reports
        with open(os.path.join(self.cache_path, "reports.pickle"), "wb") as f:
            pickle.dump(self.reports, f)

    def __run_umap(self, embeds):
        reducer = umap.UMAP()
        projection = reducer.fit_transform(embeds)
        self.status = "Done projecting"
        if isinstance(projection, (np.ndarray)):
            return projection.tolist()
        elif isinstance(projection, (list)):
            return projection
        else:
            return []

    def __get_df_rows(self, dataframe, column, list_to_get=None):
        if list_to_get is None:
            return []
        return dataframe[dataframe[column].isin(list_to_get)]

    def run_projection(self, model, instance_ids):
        filtered_rows = self.__get_df_rows(
            self.df, str(self.id_column), list_to_get=instance_ids
        )
        embedding_col = ZenoColumn(
            column_type=ZenoColumnType.EMBEDDING,
            name=model,
            transform="",
        )
        embedding_hash = str(embedding_col)
        embeds = np.stack(filtered_rows[embedding_hash].to_numpy())
        projection = self.__run_umap(embeds)
        payload = [
            {"proj": proj, "id": id} for proj, id in zip(projection, instance_ids)
        ]
        return payload

    def get_table(self, columns):
        """Get the metadata DataFrame for a given slice.

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        return get_arrow_bytes(self.df[[str(c) for c in columns]], str(self.id_column))

    def get_slices(self):
        return [s.dict(by_alias=True) for s in self.slices.values()]

    def delete_slice(self, slice_id):
        self.slices.pop(slice_id)
        with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
            pickle.dump(self.slices, f)
