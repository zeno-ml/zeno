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
                    + "{} (`{}`.astype('string').str.contains('{}', na=False,".format(
                        f.join, f.column, f.value
                    )
                    + "regex=False, case=False))"
                )
            elif f.operation == "match (regex)":
                filt = (
                    filt
                    + "{} (`{}`.astype('string').str.contains('{}', na=False))".format(
                        f.join, f.column, f.value
                    )
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
    main_df,
    filter_predicates: FilterPredicateGroup,
    filter_ids: Optional[FilterIds] = None,
) -> pd.DataFrame:
    # if we have ids, filter them out now!
    if filter_ids is not None and len(filter_ids.ids) > 0:
        # this is fast because the index is set to ids
        main_df = main_df.loc[filter_ids.ids]

    final_filter = get_filter_string(filter_predicates)
    if len(final_filter) > 0:
        return main_df.query(final_filter, engine="python")
    else:
        return main_df


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
