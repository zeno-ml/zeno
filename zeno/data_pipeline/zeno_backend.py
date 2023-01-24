"""Primary backend for Zeno. Handles all data processing and caching."""

import asyncio
import logging
import os
import pickle
import sys
import threading
from functools import lru_cache
from inspect import getsource
from math import isnan
from pathlib import Path
from typing import Callable, Dict, List, Optional, Union

import numpy as np
import pandas as pd  # type: ignore
from pathos.multiprocessing import ProcessingPool as Pool  # type: ignore

from zeno.api import ZenoOptions, ZenoParameters
from zeno.classes import (
    FilterIds,
    FilterPredicate,
    FilterPredicateGroup,
    HistogramRequest,
    MetadataType,
    MetricKey,
    Report,
    Slice,
    TableRequest,
    ZenoColumn,
    ZenoColumnType,
    ZenoState,
)
from zeno.data_pipeline.data_processing import (
    postdistill_data,
    predistill_data,
    run_inference,
)
from zeno.data_pipeline.filtering import filter_table, filter_table_single
from zeno.util import getMetadataType, load_series, read_pickle


class ZenoBackend(object):
    def __init__(self, params: ZenoParameters):
        logging.basicConfig(level=logging.INFO)

        self.df = params.metadata
        self.tests = params.functions
        self.batch_size = params.batch_size
        self.data_path = params.data_path
        self.label_path = params.label_path
        self.cache_path = params.cache_path
        self.editable = params.editable
        self.samples = params.samples
        self.view = params.view

        self.done_processing = False

        self.predistill_functions: Dict[str, Callable] = {}
        self.postdistill_functions: Dict[str, Callable] = {}
        self.metric_functions: Dict[str, Callable] = {}
        self.predict_function: Optional[Callable] = None

        self.status: str = "Initializing"
        self.folders: List[str] = read_pickle("folders.pickle", self.cache_path, [])
        self.reports: List[Report] = read_pickle("reports.pickle", self.cache_path, [])
        self.slices: Dict[str, Slice] = read_pickle(
            "slices.pickle", self.cache_path, {}
        )

        if params.models and os.path.isdir(params.models[0]):
            self.model_paths = [
                os.path.join(params.models[0], m) for m in os.listdir(params.models[0])
            ]
        else:
            self.model_paths = params.models  # type: ignore
        self.model_names = [os.path.basename(p).split(".")[0] for p in self.model_paths]

        self.__setup_dataframe(
            params.id_column, params.data_column, params.label_column
        )
        self.__parse_test_functions(self.tests)

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

    def __setup_dataframe(self, id_column: str, data_column: str, label_column: str):
        if id_column != "":
            self.id_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=getMetadataType(self.df[id_column]),
                name=id_column,
            )
        else:
            self.df.reset_index(inplace=True)
            self.id_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=MetadataType.OTHER,
                name="index",
            )

        if data_column != "":
            self.data_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=getMetadataType(self.df[data_column]),
                name=data_column,
            )
        else:
            self.data_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=MetadataType.OTHER,
                name="",
            )

        if label_column != "":
            self.label_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=getMetadataType(self.df[label_column]),
                name=label_column,
            )
        else:
            self.label_column = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=MetadataType.OTHER,
                name="",
            )

        self.df[str(self.id_column)].astype(str)
        self.df.set_index(str(self.id_column), inplace=True)
        self.df[str(self.id_column)] = self.df.index

        self.columns: List[ZenoColumn] = []
        self.complete_columns: List[ZenoColumn] = []
        for metadata_col in self.df.columns:
            col = ZenoColumn(
                column_type=ZenoColumnType.METADATA,
                metadata_type=getMetadataType(self.df[metadata_col]),
                name=str(metadata_col),
            )
            self.columns.append(col)
            self.complete_columns.append(col)

    def __parse_test_functions(self, tests: List[Callable]):
        for test_fn in tests:
            if hasattr(test_fn, "predict_function"):
                if self.predict_function is None:
                    self.predict_function = test_fn
                else:
                    print("ERROR: Multiple model functions found, can only have one")
                    sys.exit(1)
            if hasattr(test_fn, "distill_function"):
                src = getsource(test_fn)
                if "output_column" in src:
                    self.postdistill_functions[test_fn.__name__] = test_fn
                else:
                    self.predistill_functions[test_fn.__name__] = test_fn
            if hasattr(test_fn, "metric_function"):
                self.metric_functions[test_fn.__name__] = test_fn

    def start_processing(self):
        """Parse testing files, distill, and run inference."""

        if not self.tests:
            self.done_processing = True
            self.status = "Done processing"
            return

        for fn in self.predistill_functions.values():
            self.columns.append(
                ZenoColumn(column_type=ZenoColumnType.PREDISTILL, name=fn.__name__)
            )
        for fn in self.postdistill_functions.values():
            for m in self.model_names:
                self.columns.append(
                    ZenoColumn(
                        column_type=ZenoColumnType.POSTDISTILL,
                        name=fn.__name__,
                        model=m,
                    )
                )

        self.__thread = threading.Thread(target=asyncio.run, args=(self.__process(),))
        self.__thread.start()

    async def __process(self):
        self.status = "Running predistill functions"
        print(self.status)
        self.__predistill()

        self.status = "Running inference"
        print(self.status)
        self.__inference()

        self.status = "Running postdistill functions"
        print(self.status)
        self.__postdistill()

        self.status = "Done processing"
        print(self.status)
        self.done_processing = True

    def __predistill(self) -> None:
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
                predistill_outputs = pool.map(
                    predistill_data,
                    [self.predistill_functions[col.name] for col in predistill_to_run],
                    [col for col in predistill_to_run],
                    [self.zeno_options] * len(predistill_to_run),
                    [self.cache_path] * len(predistill_to_run),
                    [self.df] * len(predistill_to_run),
                    [self.batch_size] * len(predistill_to_run),
                    range(len(predistill_to_run)),
                )
                for out in predistill_outputs:
                    self.df.loc[:, str(out[0])] = out[1]
                    out[0].metadata_type = getMetadataType(self.df[str(out[0])])
                    self.complete_columns.append(out[0])

    def __inference(self):
        """Run models on instances."""

        # Check if we need to run inference since Pool is expensive
        models_to_run = []
        for model_path in self.model_paths:
            model_name = os.path.basename(model_path).split(".")[0]
            model_column = ZenoColumn(
                column_type=ZenoColumnType.OUTPUT,
                name=model_name,
            )
            embedding_column = ZenoColumn(
                column_type=ZenoColumnType.EMBEDDING,
                name=model_name,
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

        if len(models_to_run) > 0:
            with Pool() as pool:
                inference_outputs = pool.map(
                    run_inference,
                    [self.predict_function] * len(models_to_run),
                    [self.zeno_options] * len(models_to_run),
                    [m for m in models_to_run],
                    [self.cache_path] * len(models_to_run),
                    [self.df] * len(models_to_run),
                    [self.batch_size] * len(models_to_run),
                    range(len(models_to_run)),
                )
                for out in inference_outputs:
                    self.df.loc[:, str(out[0])] = out[2]
                    if not out[3].isnull().values.any():  # type: ignore
                        self.df.loc[:, str(out[1])] = out[3]
                    self.complete_columns.append(out[0])

    def __postdistill(self) -> None:
        """Run distill functions dependent on model outputs."""

        # Check if we need to run postprocessing since Pool is expensive
        postdistill_to_run: List[ZenoColumn] = []
        for postdistill_column in [
            c for c in self.columns if c.column_type == ZenoColumnType.POSTDISTILL
        ]:
            col_name = postdistill_column.copy(
                update={
                    "model": postdistill_column.model,
                }
            )
            col_hash = str(col_name)
            save_path = Path(self.cache_path, col_hash + ".pickle")

            load_series(self.df, col_hash, save_path)

            if self.df[col_hash].isnull().any():
                postdistill_to_run.append(col_name)
            else:
                col_name.metadata_type = getMetadataType(self.df[col_hash])
                self.complete_columns.append(col_name)

        if len(postdistill_to_run) > 0:
            with Pool() as pool:
                post_outputs = pool.map(
                    postdistill_data,
                    [self.postdistill_functions[e.name] for e in postdistill_to_run],
                    [e.model for e in postdistill_to_run],
                    [self.zeno_options] * len(postdistill_to_run),
                    [self.cache_path] * len(postdistill_to_run),
                    [self.df] * len(postdistill_to_run),
                    [self.batch_size] * len(postdistill_to_run),
                    range(len(postdistill_to_run)),
                )
                for out in post_outputs:
                    self.df.loc[:, str(out[0])] = out[1]  # type: ignore
                    out[0].metadata_type = getMetadataType(self.df[str(out[0])])
                    self.complete_columns.append(out[0])

    def get_metrics_for_slices(
        self,
        requests: List[MetricKey],
        filter_ids: Optional[FilterIds] = None,
    ):
        """Calculate result for each requested combination."""

        return_metrics = []
        for metric_key in requests:
            filt_df = filter_table(
                self.df, [metric_key.sli.filter_predicates], filter_ids
            )
            if (
                metric_key.state.metric == ""
                or metric_key.state.model == ""
                or self.label_column.name == ""
            ):
                return_metrics.append({"metric": None, "size": filt_df.shape[0]})
            else:
                metric = self.calculate_metric(filt_df, metric_key.state)
                return_metrics.append({"metric": metric, "size": filt_df.shape[0]})
        return return_metrics

    def calculate_metric(self, df, state):
        if not self.done_processing:
            return None

        output_col = ZenoColumn(
            column_type=ZenoColumnType.OUTPUT,
            name=state.model,
        )
        output_hash = str(output_col)

        distill_fns = [
            c
            for c in self.columns
            if (
                c.column_type == ZenoColumnType.PREDISTILL
                or c.column_type == ZenoColumnType.POSTDISTILL
            )
            and c.model == state.model
        ]

        local_ops = self.zeno_options.copy(
            update={
                "output_column": output_hash,
                "output_path": os.path.join(self.cache_path, output_hash),
                "distill_columns": dict(
                    zip([c.name for c in distill_fns], [str(c) for c in distill_fns])
                ),
            }
        )

        return self.metric_functions[state.metric](df, local_ops)

    def get_slices(self):
        return [s.dict(by_alias=True) for s in self.slices.values()]

    def get_reports(self) -> List[Report]:
        return self.reports

    def set_folders(self, folders: List[str]):
        if not self.editable:
            return
        self.folders = folders
        with open(os.path.join(self.cache_path, "folders.pickle"), "wb") as f:
            pickle.dump(self.folders, f)

    def set_reports(self, reports: List[Report]):
        if not self.editable:
            return
        self.reports = reports
        with open(os.path.join(self.cache_path, "reports.pickle"), "wb") as f:
            pickle.dump(self.reports, f)

    def create_new_slice(self, req: Slice):
        if not self.editable:
            return
        self.slices[req.slice_name] = req
        with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
            pickle.dump(self.slices, f)

    def delete_slice(self, slice_name: str):
        if not self.editable:
            return
        del self.slices[slice_name]
        with open(os.path.join(self.cache_path, "slices.pickle"), "wb") as f:
            pickle.dump(self.slices, f)

    def get_histogram_metric(
        self, df: pd.DataFrame, col: ZenoColumn, pred, state: ZenoState
    ):
        df_filt = filter_table_single(df, col, pred)
        metric = self.calculate_metric(df_filt, state)
        if metric is None or isnan(metric):
            return -1
        return metric

    def get_filtered_ids(self, req: List[Union[FilterPredicateGroup, FilterPredicate]]):
        return filter_table(self.df, req).loc[str(self.id_column)]

    def get_filtered_table(self, req: TableRequest):
        filt_df = filter_table(self.df, req.filter_predicates, req.filter_ids)
        if req.sort[0]:
            filt_df = filt_df.sort_values(str(req.sort[0]), ascending=req.sort[1])
        filt_df = filt_df.iloc[req.slice_range[0] : req.slice_range[1]]
        return filt_df[[str(col) for col in req.columns]].to_json(orient="records")

    def calculate_histograms(self, req: HistogramRequest):
        if len(req.filter_predicates) > 0:
            filt_df = filter_table(self.df, req.filter_predicates)
        else:
            filt_df = self.df

        if req.state.metric == "" or req.state.model == "":
            req.get_metrics = False

        cols = req.columns

        # For each histogram request return a list of buckets like:
        # {
        #    bucket: start value
        #    bucketEnd: end value (optional)
        #    count: number of entries in this bucket
        #    filteredCount: number of entries in this bucket after filtering
        #    metric: metric value for this bucket (optional)
        # }
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
                            "count": int(val_counts[k]),  # type: ignore
                            "filteredCount": int((filt_df_col == k).sum()),
                            "metric": self.get_histogram_metric(
                                filt_df, col, k, req.state
                            )
                            if req.get_metrics
                            else None,
                        }
                    )
                    for k in val_counts.keys()
                ]
                res[str(col)] = ret_hist
            elif col.metadata_type == MetadataType.CONTINUOUS:
                ret_hist = []
                df_col = df_col.fillna(0)
                bins = np.histogram(df_col, bins="doane")
                bins_filt = np.histogram(filt_df_col, bins=bins[1])
                for i, bin_count in enumerate(bins[0]):
                    ret_hist.append(
                        {
                            "bucket": round(bins[1][i], 4),
                            "bucketEnd": round(bins[1][i + 1], 4),
                            "count": int(bin_count),
                            "filteredCount": int(bins_filt[0][i]),
                            "metric": self.get_histogram_metric(
                                filt_df, col, [bins[1][i], bins[1][i + 1]], req.state
                            )
                            if req.get_metrics
                            else None,
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

    def embed_exists(self, model: str):
        """Checks for the existence of an embedding column.
        Returns True if the column exists, False otherwise
        """
        embed_column = ZenoColumn(name=model, column_type=ZenoColumnType.EMBEDDING)
        exists = str(embed_column) in self.df.columns
        return exists and not self.df[str(embed_column)].isnull().any()

    @lru_cache()
    def project_embed_into_2D(self, model: str) -> Dict[str, list]:
        """If the embedding exists, will use t-SNE to project into 2D.
        Returns the 2D embeddings as object/dict
        {
            x: list[float]
            y: list[float]
            ids: list[str]
        }
        """

        points: Dict[str, list] = {"x": [], "y": [], "ids": []}

        # Can't project without an embedding
        if not self.embed_exists(model):
            return points

        embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)

        # Extract embeddings and store in one big ndarray
        embed = self.df[str(embed_col)].to_numpy()
        embed = np.stack(embed, axis=0)  # type: ignore

        # project embeddings into 2D
        from sklearn.manifold import TSNE  # type: ignore

        projection = TSNE().fit_transform(embed)

        # extract points and ids from computed projection
        points["x"] = projection[:, 0].tolist()
        points["y"] = projection[:, 1].tolist()
        points["ids"] = self.df[str(self.id_column)].to_list()

        return points
