"""Functions for parsing filter predicates and filtering dataframes"""
from typing import List, Optional, Union

import pandas as pd
from pandas import DataFrame

from zeno.classes.base import MetadataType, ZenoColumn
from zeno.classes.metadata import HistogramBucket

from zeno.classes.slice import FilterIds, FilterPredicate, FilterPredicateGroup


def get_filter_string(filter: Union[FilterPredicateGroup, FilterPredicate]):
    if isinstance(filter, FilterPredicateGroup):
        if len(filter.predicates) > 0:
            filt = "("
            for i, pred in enumerate(filter.predicates):
                filt = filt + get_filter_string(pred)
                if i == len(filter.predicates) - 1 and (
                    filt[-1] == "&" or filt[-1] == "|"
                ):
                    filt = filt[0:-1]
            return filt + ")" + (filter.join if filter.join else "")
    else:
        if filter.operation == "match":
            return "(`{}`.str.match('{}', na=False)) {}".format(
                filter.column, filter.value, filter.join
            )
        else:
            try:
                val = str(float(filter.value))
            except ValueError:
                if str(filter.value).lower() in [
                    "true",
                    "false",
                ]:
                    val = "True" if str(filter.value).lower() == "true" else "False"
                else:
                    val = '"{}"'.format(filter.value)
            return "(`{}` {} {}) {}".format(
                filter.column, filter.operation, val, filter.join
            )
    return ""


def filter_table(
    df,
    filter_predicates: List[Union[FilterPredicate, FilterPredicateGroup]],
    filter_ids: Optional[FilterIds] = None,
) -> pd.DataFrame:
    # if we have ids, filter them out now!
    if filter_ids is not None and len(filter_ids.ids) > 0:
        # this is fast because the index is set to ids
        df = df.loc[filter_ids.ids]

    final_filter = ""
    for filt in filter_predicates:
        final_filter = final_filter + get_filter_string(filt)
    if (
        len(filter_predicates) > 0
        and len(final_filter) > 0
        and (final_filter[-1] == "&" or final_filter[-1] == "|")
    ):
        final_filter = final_filter[0:-1]
    if len(final_filter) > 0:
        return df.query(final_filter)
    else:
        return df


def filter_table_single(df: DataFrame, col: ZenoColumn, bucket: HistogramBucket):
    if (
        col.metadata_type == MetadataType.NOMINAL
        or col.metadata_type == MetadataType.BOOLEAN
    ):
        return df[df[str(col)] == bucket.bucket]
    elif col.metadata_type == MetadataType.CONTINUOUS:
        return df[(df[str(col)] > bucket.bucket) & (df[str(col)] < bucket.bucket_end)]
    elif col.metadata_type == MetadataType.DATETIME:
        return df
    return df
