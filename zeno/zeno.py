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
import pandas as pd  # type: ignore

from zeno.api import ZenoOptions
from zeno.classes import (
    HistogramRequest,
    MetadataType,
    MetricKey,
    Report,
    Slice,
    TableRequest,
    ZenoColumn,
    ZenoColumnType,
    ZenoFunction,
    ZenoFunctionType,
    ZenoState,
)
from zeno.filtering import filter_table, filter_table_single
from zeno.mirror import Mirror
from zeno.util import (
    add_to_path,
    get_function,
    getMetadataType,
    load_series,
    postdistill_data,
    predistill_data,
    read_pickle,
    run_inference,
    transform_data,
)


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
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

        self.__load_metadata_file(metadata_path, id_column, data_column, label_column)

        self.tests = tests
        self.batch_size = batch_size
        self.data_path = data_path
        self.label_path = label_path
        self.status: str = "Initializing"
        self.done_processing = False

        self.distill_functions: Dict[str, ZenoFunction] = {}
        self.metric_functions: Dict[str, ZenoFunction] = {}
        self.transform_functions: Dict[str, ZenoFunction] = {}
        self.predict_function: ZenoFunction = ZenoFunction(
            name="", file_name=Path(""), fn_type=ZenoFunctionType.PREDICTION
        )

        self.metadata_name = os.path.basename(metadata_path).split(".")[0]
        self.cache_path = cache_path

        self.folders: List[str] = read_pickle("folders.pickle", self.cache_path, [])
        self.reports: List[Report] = read_pickle("reports.pickle", self.cache_path, [])
        self.slices: Dict[str, Slice] = read_pickle(
            "slices.pickle", self.cache_path, {}
        )

        if models and os.path.isdir(models[0]):
            self.model_paths = [
                os.path.join(models[0], m) for m in os.listdir(models[0])
            ]
        else:
            self.model_paths = models  # type: ignore
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.mirror = Mirror(self.df, self.cache_path, self.id_column)
        self.mirror.generate_slices()

        # Options passed to Zeno functions.
        self.zeno_options = ZenoOptions(
            id_column=str(self.id_column),
            data_column=str(self.data_column),
            label_column=str(self.label_column),
            distill_columns=dict(),
            data_path=self.data_path,
            label_path=self.label_path,
            output_column="",
            output_path="",
        )

    def __load_metadata_file(
        self, metadata_path: Path, id_column: str, data_column: str, label_column: str
    ):
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

        self.id_column = ZenoColumn(
            column_type=ZenoColumnType.METADATA,
            metadata_type=getMetadataType(self.df[id_column]),
            name=id_column,
        )
        self.data_column = ZenoColumn(
            column_type=ZenoColumnType.METADATA,
            metadata_type=getMetadataType(self.df[data_column]),
            name=data_column,
        )
        self.label_column = ZenoColumn(
            column_type=ZenoColumnType.METADATA,
            metadata_type=getMetadataType(self.df[label_column]),
            name=label_column,
        )
        self.df = self.df.rename(columns=lambda x: "0" + str(x))

        self.df[str(self.id_column)].astype(str)
        self.df.set_index(str(self.id_column), inplace=True)
        self.df[str(self.id_column)] = self.df.index

        self.columns: List[ZenoColumn] = []
        self.complete_columns: List[ZenoColumn] = []
        for metadata_col in self.df.columns:
            col = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=getMetadataType(self.df[metadata_col]),
                name=metadata_col[1:],
            )
            self.columns.append(col)
            self.complete_columns.append(col)

        # TODO: figure out if this breaks for big integers. Need to do this for
        # frontend bigint issues.
        d = dict.fromkeys(
            self.df.select_dtypes(np.int64).columns, np.int32  # type: ignore
        )
        self.df = self.df.astype(d)  # type: ignore

    def start_processing(self):
        """Parse testing files, distill, and run inference."""

        if not self.tests:
            self.done_processing = True
            self.status = "Done processing"
            return

        # Add directory with tests to path for relative imports.
        for f in list(self.tests.rglob("*.py")):
            self.__parse_testing_file(f)

        for fn in self.distill_functions.values():
            if fn.fn_type == ZenoFunctionType.PREDISTILL:
                self.columns.append(
                    ZenoColumn(column_type=ZenoColumnType.PREDISTILL, name=fn.name)
                )
            else:
                for m in self.model_names:
                    self.columns.append(
                        ZenoColumn(
                            column_type=ZenoColumnType.POSTDISTILL,
                            name=fn.name,
                            model=m,
                        )
                    )

        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
        self.__thread.start()

    def __parse_testing_file(self, test_file: Path):
        # To allow relative imports in test files,
        # add their directory to path temporarily.
        with add_to_path(os.path.dirname(os.path.abspath(test_file))):
            spec = util.spec_from_file_location(str(test_file), test_file)
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
                predistill_column.metadata_type = getMetadataType(
                    self.df[str(predistill_column)]
                )
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
                    out[0].metadata_type = getMetadataType(self.df[str(out[0])])
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
                    if not out[3].isnull().values.any():  # type: ignore
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
                col_name.metadata_type = getMetadataType(self.df[col_hash])
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
                    self.df.loc[:, str(out[0])] = out[1]  # type: ignore
                    out[0].metadata_type = getMetadataType(self.df[str(out[0])])
                    self.complete_columns.append(out[0])

        self.status = "Done running postprocessing"

    def get_metrics_for_slices(self, requests: List[MetricKey]):
        """Calculate result for each requested combination."""

        return_metrics = []
        for metric_key in requests:
            filt_df = filter_table(self.df, metric_key.sli.filter_predicates.predicates)
            return_metrics.append(self.calculate_metric(filt_df, metric_key.state))
        return return_metrics

    def calculate_metric(self, df, state):
        if not self.done_processing:
            return -1

        output_col = ZenoColumn(
            column_type=ZenoColumnType.OUTPUT,
            name=state.model,
            transform=state.transform,
        )
        output_hash = str(output_col)

        distill_fns = [
            c
            for c in self.columns
            if (
                c.column_type == ZenoColumnType.PREDISTILL
                or c.column_type == ZenoColumnType.POSTDISTILL
            )
            and c.transform == state.transform
            and c.model == state.model
        ]

        local_ops = dataclasses.replace(
            self.zeno_options,
            output_column=output_hash,
            output_path=os.path.join(self.cache_path, output_hash),
            distill_columns=dict(
                zip([c.name for c in distill_fns], [str(c) for c in distill_fns])
            ),
        )

        metric_func = get_function(self.metric_functions[state.metric])
        return metric_func(df, local_ops)

    def get_slices(self):
        return [s.dict(by_alias=True) for s in self.slices.values()]

    def get_reports(self):
        return [r.dict(by_alias=True) for r in self.reports]

    def set_folders(self, folders):
        self.folders = folders
        with open(os.path.join(self.cache_path, "folders.pickle"), "wb") as f:
            pickle.dump(self.folders, f)

    def set_reports(self, reports: List[Report]):
        self.reports = reports
        with open(os.path.join(self.cache_path, "reports.pickle"), "wb") as f:
            pickle.dump(self.reports, f)

    def get_histogram_metric(
        self, df: pd.DataFrame, col: ZenoColumn, pred, state: ZenoState
    ):
        df_filt = filter_table_single(df, col, pred)
        return self.calculate_metric(df_filt, state)

    def get_filtered_table(self, req: TableRequest):
        filt_df = filter_table(self.df, req.filter_predicates).iloc[
            req.slice_range[0] : req.slice_range[1]
        ]
        return filt_df[[str(col) for col in req.columns]].to_json(orient="records")

    def calculate_histograms(self, req: HistogramRequest):
        if len(req.filter_predicates) > 0:
            filt_df = filter_table(self.df, req.filter_predicates)
        else:
            filt_df = self.df

        cols = req.columns
        res = {}
        for col in cols:
            df_col = self.df[str(col)]
            filt_df_col = filt_df[str(col)]
            if col.metadata_type == MetadataType.NOMINAL:
                ret_hist = []
                val_counts = df_col.value_counts()
                [
                    ret_hist.append(
                        {
                            "bucket": k,
                            "count": int(val_counts[k]),
                            "filteredCount": int((filt_df_col == k).sum()),
                            "metric": self.get_histogram_metric(
                                filt_df, col, k, req.state
                            ),
                        }
                    )
                    for k in val_counts.keys()
                ]
                res[str(col)] = ret_hist
            elif col.metadata_type == MetadataType.CONTINUOUS:
                res[str(col)] = col.name
                ret_hist = []
                bins = np.histogram(df_col, bins="doane")
                bins_filt = np.histogram(filt_df_col, bins=bins[1])
                for i, bin_count in enumerate(bins[0]):
                    ret_hist.append(
                        {
                            "bucket": round(bins[1][i], 2),
                            "bucketEnd": round(bins[1][i + 1], 2),
                            "count": int(bin_count),
                            "filteredCount": int(bins_filt[0][i]),
                            "metric": self.get_histogram_metric(
                                filt_df, col, [bins[1][i], bins[1][i + 1]], req.state
                            ),
                        }
                    )
                res[str(col)] = ret_hist
            elif col.metadata_type == MetadataType.BOOLEAN:
                res[str(col)] = [
                    {
                        "bucket": True,
                        "count": df_col.sum(),
                        "filteredCount": filt_df_col.sum(),
                    },
                    {
                        "bucket": False,
                        "count": len(df_col) - df_col.sum(),
                        "filteredCount": len(filt_df_col) - filt_df_col.sum(),
                    },
                ]
            elif col.metadata_type == MetadataType.DATETIME:
                res[str(col)] = []
            else:
                res[str(col)] = []
        return res

    def create_new_slice(self, req: Slice):
        self.slices[req.slice_name] = req
        with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
            pickle.dump(self.slices, f)

    def embedding_exists(self, model: str):
        col = ZenoColumn(name=model, column_type=ZenoColumnType.EMBEDDING)
        return str(col) in self.df.columns
