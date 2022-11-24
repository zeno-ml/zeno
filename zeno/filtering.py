from typing import List, Union

import pandas as pd

from zeno.classes import FilterPredicate, FilterPredicateGroup, MetadataType, ZenoColumn


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
    df, filters: List[Union[FilterPredicate, FilterPredicateGroup]]
) -> pd.DataFrame:
    final_filter = ""
    for filt in filters:
        final_filter = final_filter + get_filter_string(filt)
    if (
        len(filters) > 0
        and len(final_filter) > 0
        and (final_filter[-1] == "&" or final_filter[-1] == "|")
    ):
        final_filter = final_filter[0:-1]
    if len(final_filter) > 0:
        return df.query(final_filter)
    else:
        return df


def filter_table_single(df, col: ZenoColumn, pred):
    if (
        col.metadata_type == MetadataType.NOMINAL
        or col.metadata_type == MetadataType.BOOLEAN
    ):
        return df[df[str(col)] == pred]
    elif col.metadata_type == MetadataType.CONTINUOUS:
        return df[(df[str(col)] > pred[0]) & (df[str(col)] < pred[1])]
    elif col.metadata_type == MetadataType.DATETIME:
        return df
    return df
