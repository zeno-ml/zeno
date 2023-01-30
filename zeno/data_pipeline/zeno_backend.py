"""Primary backend for Zeno. Handles all data processing and caching."""

import asyncio
import logging
import os
import pickle
import sys
import threading
from inspect import getsource
from math import isnan
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
from methodtools import lru_cache  # type: ignore
from pandas import DataFrame  # type: ignore
from pathos.multiprocessing import ProcessingPool as Pool  # type: ignore
from sklearn import preprocessing  # type: ignore

from zeno.api import ZenoOptions, ZenoParameters
from zeno.classes.base import MetadataType, ZenoColumnType
from zeno.classes.classes import MetricKey, TableRequest, ZenoColumn
from zeno.classes.metadata import HistogramBucket, HistogramRequest
from zeno.classes.projection import Points2D
from zeno.classes.report import Report
from zeno.classes.slice import (
    FilterIds,
    FilterPredicate,
    FilterPredicateGroup,
    Slice,
    SliceMetric,
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

        self.done_running_inference = False

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
            self.done_running_inference = True
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
        self.done_running_inference = True

        self.status = "Running postdistill functions"
        print(self.status)
        self.__postdistill()

        self.status = "Done processing"
        print(self.status)

    def __predistill(self) -> None:
        """Run distilling functions not dependent on model outputs."""

        # Check if we need to preprocess since Pool is expensive
        predistill_to_run: List[ZenoColumn] = []
        for predistill_column in [
            c for c in self.columns if c.column_type == ZenoColumnType.PREDISTILL
        ]:
            save_path = Path(self.cache_path, str(predistill_column) + ".pickle")

            load_series(self.df, predistill_column, save_path)

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
                    out[0].metadata_type = getMetadataType(out[1])
                    self.df.loc[:, str(out[0])] = out[1]
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

            load_series(self.df, model_column, model_save_path)
            load_series(self.df, embedding_column, embedding_save_path)

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

            load_series(self.df, col_name, save_path)

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
                    out[0].metadata_type = getMetadataType(out[1])
                    self.df.loc[:, str(out[0])] = out[1]  # type: ignore
                    self.complete_columns.append(out[0])

    def get_metrics_for_slices(
        self,
        requests: List[MetricKey],
        filter_ids: Optional[FilterIds] = None,
    ) -> List[SliceMetric]:
        """Calculate result for each requested combination."""

        return_metrics: List[SliceMetric] = []
        for metric_key in requests:
            filt_df = filter_table(
                self.df, [metric_key.sli.filter_predicates], filter_ids
            )
            if metric_key.metric == "" or self.label_column.name == "":
                return_metrics.append(SliceMetric(metric=None, size=filt_df.shape[0]))
            else:
                metric = self.calculate_metric(
                    filt_df, metric_key.model, metric_key.metric
                )
                return_metrics.append(SliceMetric(metric=metric, size=filt_df.shape[0]))
        return return_metrics

    def calculate_metric(
        self, df: DataFrame, model: Union[str, None], metric: str
    ) -> Union[float, None]:
        if not self.done_running_inference:
            return None

        if model is not None:

            output_col = ZenoColumn(
                column_type=ZenoColumnType.OUTPUT,
                name=model,
            )
            output_hash = str(output_col)

            distill_fns = [
                c
                for c in self.columns
                if (
                    c.column_type == ZenoColumnType.PREDISTILL
                    or c.column_type == ZenoColumnType.POSTDISTILL
                )
                and c.model == model
            ]

            local_ops = self.zeno_options.copy(
                update={
                    "output_column": output_hash,
                    "output_path": os.path.join(self.cache_path, output_hash),
                    "distill_columns": dict(
                        zip(
                            [c.name for c in distill_fns], [str(c) for c in distill_fns]
                        )
                    ),
                }
            )
        else:
            distill_fns = [
                c
                for c in self.columns
                if (
                    c.column_type == ZenoColumnType.PREDISTILL
                    or c.column_type == ZenoColumnType.POSTDISTILL
                )
            ]

            local_ops = self.zeno_options.copy(
                update={
                    "distill_columns": dict(
                        zip(
                            [c.name for c in distill_fns], [str(c) for c in distill_fns]
                        )
                    ),
                }
            )

        return self.metric_functions[metric](df, local_ops)

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

    def get_filtered_ids(self, req: List[Union[FilterPredicateGroup, FilterPredicate]]):
        return filter_table(self.df, req)[str(self.id_column)].to_json(orient="records")

    def get_filtered_table(self, req: TableRequest):
        """Return filtered table from list of filter predicates."""
        filt_df = filter_table(self.df, req.filter_predicates, req.filter_ids)
        if req.sort[0]:
            filt_df = filt_df.sort_values(str(req.sort[0]), ascending=req.sort[1])
        filt_df = filt_df.iloc[req.slice_range[0] : req.slice_range[1]]
        return filt_df[[str(col) for col in req.columns]].to_json(orient="records")

    def get_histogram_buckets(
        self, req: List[ZenoColumn]
    ) -> List[List[HistogramBucket]]:
        """Calculate the histogram buckets for a list of columns."""
        res: List[List[HistogramBucket]] = []
        for col in req:
            df_col = self.df[str(col)]
            if col.metadata_type == MetadataType.NOMINAL:
                ret_hist: List[HistogramBucket] = []
                val_counts = df_col.value_counts()
                for k in val_counts.keys():
                    ret_hist.append(HistogramBucket(bucket=k))
                res.append(ret_hist)
            elif col.metadata_type == MetadataType.CONTINUOUS:
                ret_hist: List[HistogramBucket] = []  # type: ignore
                df_col = df_col.fillna(0)
                bins = np.histogram(df_col, bins="doane")
                for i in range(len(bins[0])):
                    ret_hist.append(
                        HistogramBucket(
                            bucket=round(bins[1][i], 4),
                            bucket_end=round(bins[1][i + 1], 4),
                        )
                    )
                res.append(ret_hist)
            elif col.metadata_type == MetadataType.BOOLEAN:
                res.append(
                    [
                        HistogramBucket(bucket=True),
                        HistogramBucket(bucket=False),
                    ]
                )
            elif col.metadata_type == MetadataType.DATETIME:
                res.append([])
            else:
                res.append([])
        return res

    def get_histogram_counts(self, req: HistogramRequest) -> List[List[int]]:
        """Calculate count for each bucket in each column histogram."""
        if req.filter_predicates is not None:
            filt_df = filter_table(self.df, [req.filter_predicates], req.filter_ids)
        else:
            filt_df = self.df

        ret: List[List[int]] = []
        for r in req.column_requests:
            col = r.column
            ret.append([len(filter_table_single(filt_df, col, b)) for b in r.buckets])
        return ret

    def get_histogram_metric(
        self,
        df: pd.DataFrame,
        col: ZenoColumn,
        bucket: HistogramBucket,
        model: str,
        metric: str,
    ) -> Union[float, None]:
        df_filt = filter_table_single(df, col, bucket)
        output_metric = self.calculate_metric(df_filt, model, metric)
        if output_metric is None or isnan(output_metric):
            return None
        return output_metric

    def get_histogram_metrics(
        self, req: HistogramRequest
    ) -> List[List[Union[float, None]]]:
        """Calculate metric for each bucket in each column histogram."""
        if req.metric is None:
            return []

        if req.filter_predicates is not None:
            filt_df = filter_table(self.df, [req.filter_predicates], req.filter_ids)
        else:
            filt_df = self.df

        ret: List[List[Union[float, None]]] = []
        for r in req.column_requests:
            col = r.column
            loc_ret: List[Union[float, None]] = []
            for b in r.buckets:
                df_filt = filter_table_single(filt_df, col, b)
                metric = self.calculate_metric(df_filt, req.model, req.metric)
                if metric is None or isnan(metric):
                    loc_ret.append(None)
                else:
                    loc_ret.append(metric)
            ret.append(loc_ret)
        return ret

    def embed_exists(self, model: str):
        """Checks for the existence of an embedding column.
        Returns True if the column exists, False otherwise
        """
        embed_column = ZenoColumn(name=model, column_type=ZenoColumnType.EMBEDDING)
        exists = str(embed_column) in self.df.columns
        return exists and not self.df[str(embed_column)].isnull().any()

    @lru_cache(
        maxsize=5
    )  # will cache up 5 model projections in memory before needing to recompute
    def run_tsne(self, model: str) -> np.ndarray:
        # Extract embeddings and store in one big ndarray
        embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)

        embed = self.df[str(embed_col)].to_numpy()
        embed = np.stack(embed, axis=0)  # type: ignore

        # project embeddings into 2D
        from sklearn.manifold import TSNE  # type: ignore

        return TSNE().fit_transform(embed)

    def get_projection_colors(self, column: ZenoColumn) -> Tuple[List[int], List, str]:
        """Get colors for a projection based on a column.

        Args:
            column (ZenoColumn): Column to use for coloring the projection.

        Returns:
            Tuple[List[int], List, str]: The color range, the unique values,
                and the metadata type.
        """
        series = self.df[str(column)]
        unique = series.unique()
        metadata_type = "nominal"
        color_range: List[int] = []
        if len(unique) == 2:
            metadata_type = "boolean"
        if len(unique) > 10:
            if column.metadata_type == MetadataType.CONTINUOUS:
                metadata_type = "continuous"
                color_range = (
                    np.interp(series, (series.min(), series.max()), (0, 20))
                    .astype(int)
                    .tolist()
                )
                unique = np.array([series.min(), series.max()])
            else:
                metadata_type = "other"
                color_range = [0] * len(series)
        else:
            labels = preprocessing.LabelEncoder().fit_transform(series)
            if isinstance(labels, np.ndarray):
                color_range = labels.astype(int).tolist()
            else:
                color_range = [0] * len(series)
        return color_range, unique.tolist(), metadata_type

    def project_embed_into_2D(self, model: str, column: ZenoColumn) -> Points2D:
        """If the embedding exists, will use t-SNE to project into 2D."""

        points = Points2D(
            x=[], y=[], color=[], domain=[], opacity=[], dataType="", ids=[]
        )

        # Can't project without an embedding
        if not self.embed_exists(model):
            return points

        projection = self.run_tsne(model)

        # extract points and ids from computed projection
        points.x = projection[:, 0].tolist()
        points.y = projection[:, 1].tolist()
        color_results = self.get_projection_colors(column)
        points.color = color_results[0]
        points.domain = color_results[1]
        points.dataType = color_results[2]
        points.ids = self.df[str(self.id_column)].to_list()

        return points
