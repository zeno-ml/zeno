"""Functions for parsing filter predicates and filtering dataframes"""
from typing import Optional

import pandas as pd
from pandas import DataFrame

from zeno.classes.base import MetadataType, ZenoColumn
from zeno.classes.metadata import HistogramBucket
from zeno.classes.slice import FilterIds, FilterPredicate, FilterPredicateGroup


def get_filter_string(filter: FilterPredicateGroup) -> str:
    """Generate a filter string for Pandas query from a nested set of FilterPredicates.
    The join should go on the second predicate in a group.

    Args:
        filter (FilterPredicateGroup): Parent FilterPredicateGroup

    Returns:
        str: Filter string with added predicates
    """
    filt = ""
    for f in filter.predicates:
        if isinstance(f, FilterPredicateGroup):
            if len(f.predicates) != 0:
                filt = filt + f.join + "("
                filt = filt + get_filter_string(f)
                filt = filt + ")"
        elif isinstance(f, FilterPredicate):
            if f.operation == "match":
                filt = (
                    filt
                    + "{} (`{}`.str.contains('{}', na=False, regex=False))".format(
                        f.join, f.column, f.value
                    )
                )
            elif f.operation == "match (regex)":
                filt = filt + "{} (`{}`.str.contains('{}', na=False))".format(
                    f.join, f.column, f.value
                )
            else:
                try:
                    val = str(float(f.value))
                except ValueError:
                    if str(f.value).lower() in [
                        "true",
                        "false",
                    ]:
                        val = "True" if str(f.value).lower() == "true" else "False"
                    else:
                        val = '"{}"'.format(f.value)
                filt = filt + "{} (`{}` {} {})".format(
                    f.join, f.column, f.operation, val
                )
    return filt


def filter_table(
    df,
    filter_predicates: Optional[FilterPredicateGroup] = None,
    list_ids_first: Optional[FilterIds] = None,
    list_ids_second: Optional[FilterIds] = None,
) -> pd.DataFrame:
    allIndicies = []  # type: ignore
    if list_ids_first is not None and len(list_ids_first.ids) > 0:
        allIndicies += list_ids_first.ids  # type: ignore
    if list_ids_second is not None and len(list_ids_second.ids) > 0:
        allIndicies += list_ids_second.ids  # type: ignore
    # if we have ids, filter them out now!
    if len(allIndicies) > 0:
        # make sure the ids we are querying exist
        existingIds = df.index.intersection(allIndicies)
        # this is fast because the index is set to ids
        df = df.loc[existingIds]

    if filter_predicates is not None:
        final_filter = get_filter_string(filter_predicates)
        if len(final_filter) > 0:
            return df.query(final_filter)

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
