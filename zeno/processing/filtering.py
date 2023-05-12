"""Functions for parsing filter predicates and filtering dataframes"""
from typing import List, Optional

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
            if "match" in f.operation:
                is_regex = "re" in f.operation
                is_case = "ca" in f.operation
                is_whole = "w" in f.operation

                if is_whole:
                    f.value = f"\\b{f.value}\\b" if is_regex else f'"{f.value}"'

                filt_string = f"{f.join} (`{f.column}`.str.contains(\
                    r'{f.value}', na=False, regex={is_regex}, case={is_case}))"

                if (not is_regex) and is_whole:
                    filt_string = f"{f.join} (`{f.column}`=={f.value})"

                try:
                    filt += filt_string
                except Exception as e:
                    print("Invalid Regex Error: ", e)
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
    filter_predicates: Optional[FilterPredicateGroup] = None,
    list_ids_first: Optional[FilterIds] = None,
    list_ids_second: Optional[FilterIds] = None,
    tag_list: Optional[List[str]] = None,
) -> pd.DataFrame:
    all_indicies = []
    if list_ids_first is not None and len(list_ids_first.ids) > 0:
        all_indicies += list_ids_first.ids
    if list_ids_second is not None and len(list_ids_second.ids) > 0:
        all_indicies += list_ids_second.ids
    # if we have ids, filter them out now!
    if len(all_indicies) > 0:
        # make sure the ids we are querying exist
        existing_ids = main_df.index.intersection(all_indicies)
        # this is fast because the index is set to ids
        main_df = main_df.loc[existing_ids]

    # empty selected tags so always return empty table
    if len(all_indicies) == 0 and tag_list is not None and len(tag_list) > 0:
        return main_df.iloc[0:0]

    if filter_predicates is not None:
        final_filter = get_filter_string(filter_predicates)
        if len(final_filter) > 0:
            return main_df.query(final_filter, engine="python")

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
