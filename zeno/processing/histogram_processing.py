"""Functions for creating the frontend metadata histograms."""
import re
from math import isnan
from typing import Callable, List, Union

import numpy as np
import pandas as pd

from zeno.classes.base import MetadataType, ZenoColumn
from zeno.classes.metadata import HistogramBucket, HistogramRequest, StringFilterRequest
from zeno.processing.filtering import filter_table, filter_table_single


def histogram_buckets(
    df: pd.DataFrame, req: List[ZenoColumn]
) -> List[List[HistogramBucket]]:
    """Calculate the histogram buckets for a list of columns."""
    res: List[List[HistogramBucket]] = []
    for col in req:
        df_col = df[str(col)]
        if col.metadata_type == MetadataType.NOMINAL:
            ret_hist: List[HistogramBucket] = []
            val_counts = df_col.value_counts()
            for k in val_counts.keys():
                ret_hist.append(HistogramBucket(bucket=k))
            res.append(ret_hist)
        elif col.metadata_type == MetadataType.CONTINUOUS:
            ret_hist: List[HistogramBucket] = []  # type: ignore
            df_col = df_col.fillna(0)
            bins = np.histogram_bin_edges(df_col)
            for i in range(len(bins) - 1):
                ret_hist.append(
                    HistogramBucket(
                        bucket=bins[i],
                        bucket_end=bins[i + 1],
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


def histogram_counts(df: pd.DataFrame, req: HistogramRequest) -> List[List[int]]:
    """Calculate count for each bucket in each column histogram."""
    if req.filter_predicates is not None:
        filt_df = filter_table(df, req.filter_predicates, req.filter_ids)
    else:
        filt_df = df

    ret: List[List[int]] = []
    for r in req.column_requests:
        col = r.column
        if str(col) not in filt_df.columns:
            ret.append([])
        elif col.metadata_type == MetadataType.NOMINAL:
            counts = filt_df.groupby([str(col)]).size()
            ret.append(
                [
                    counts[b.bucket] if b.bucket in counts else 0  # type: ignore
                    for b in r.buckets
                ]
            )
        elif col.metadata_type == MetadataType.BOOLEAN:
            ret.append(
                [filt_df[str(col)].sum(), len(filt_df) - filt_df[str(col)].sum()]
            )
        elif col.metadata_type == MetadataType.CONTINUOUS:
            bucs = [b.bucket for b in r.buckets]
            ret.append(
                filt_df.groupby([pd.cut(filt_df[str(col)], bucs)])  # type: ignore
                .size()
                .astype(int)
                .tolist()
            )
        else:
            ret.append([])
    return ret


def histogram_metric(
    df: pd.DataFrame,
    metric_fn: Callable,
    col: ZenoColumn,
    bucket: HistogramBucket,
    model: str,
    metric: str,
) -> Union[float, None]:
    df_filt = filter_table_single(df, col, bucket)
    output_metric = metric_fn(df_filt, model, metric)
    if output_metric is None or isnan(output_metric):
        return None
    return output_metric


def histogram_metrics(
    df: pd.DataFrame, metric_fn: Callable, req: HistogramRequest
) -> List[List[Union[float, None]]]:
    """Calculate metric for each bucket in each column histogram."""
    if req.metric is None:
        return []

    if req.filter_predicates is not None:
        filt_df = filter_table(df, req.filter_predicates, req.filter_ids)
    else:
        filt_df = df

    ret: List[List[Union[float, None]]] = []
    for r in req.column_requests:
        col = r.column
        loc_ret: List[Union[float, None]] = []
        for b in r.buckets:
            df_filt = filter_table_single(filt_df, col, b)
            metric = metric_fn(df_filt, req.model, req.metric)
            if metric is None or isnan(metric):
                loc_ret.append(None)
            else:
                loc_ret.append(metric)
        ret.append(loc_ret)
    return ret


def filter_by_string(df: pd.DataFrame, req: StringFilterRequest) -> List[str]:
    """Filter the table based on a string filter request."""
    col = df[str(req.column)].astype(str)

    short_ret: List[str] = []
    if req.selection_type == "string":
        ret = [i for i in col if req.filter_string in i]

        for r in ret[0:5]:
            idx = r.find(req.filter_string)
            loc_str = r[idx - 20 : idx + 20]
            if len(r) > 40 + len(req.filter_string):
                if idx - 20 > 0:
                    loc_str = loc_str + "..."
                if idx + 20 < len(r):
                    loc_str = "..." + loc_str
            short_ret.append(loc_str)
    else:
        ret = col[col.str.contains(req.filter_string, case=False)].head().tolist()
        for r in ret:
            idx = re.search(req.filter_string, r)
            if idx is not None:
                idx = idx.start()
                loc_str = r[idx - 20 : idx + 20]
                if len(r) > 40 + len(req.filter_string):
                    if idx - 20 > 0:
                        loc_str = loc_str + "..."
                    if idx + 20 < len(r):
                        loc_str = "..." + loc_str
                short_ret.append(loc_str)
    return short_ret
