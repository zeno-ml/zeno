import secrets
from typing import List

import numpy as np
import pandas as pd
from sliceline.slicefinder import Slicefinder

from zeno.classes.slice import FilterPredicate, FilterPredicateGroup, Slice
from zeno.classes.slice_finder import SliceFinderRequest, SliceFinderReturn


# encode continuous value to range bins categorical columns
def cont_cols_df(df, cols: List[str]):
    new_df = pd.DataFrame()
    for col in cols:
        df_col = df.loc[:, col].copy()
        bins = list(np.histogram_bin_edges(df_col, bins="doane"))
        bins[0], bins[len(bins) - 1] = bins[0] - 1, bins[len(bins) - 1] + 1
        new_df.loc[:, col + "_encode"] = pd.cut(df_col, bins=bins)
    return new_df


def slice_finder(df, req: SliceFinderRequest):
    """Return slices of data with high or low metric values.

    Args:
        df (DataFrame): Zeno DataFrame with all metadata.
        req (SliceFinderRequest): Request with columns, metrics, and options.

    Returns a SliceFinderMetricReturn Object.
    """
    cont_search_cols = [str(col) for col in req.search_columns_cont]
    not_cont_search_cols = [str(col) for col in req.search_columns]

    cont_df = cont_cols_df(df[cont_search_cols].dropna(), cont_search_cols)

    uniq_cols = set(not_cont_search_cols + [str(req.metric_column)])
    updated_df = pd.concat([df[list(uniq_cols)], cont_df], axis=1).dropna()

    # Invert metric column if ascending.
    normalized_metric_col = np.array(updated_df[str(req.metric_column)], dtype=float)
    metric_max = np.max(normalized_metric_col)
    if req.order_by == "ascending":
        normalized_metric_col = metric_max - normalized_metric_col

    cont_search_cols = [col + "_encode" for col in cont_search_cols]
    search_cols = not_cont_search_cols + cont_search_cols
    slice_finder = Slicefinder(alpha=req.alpha, k=20, max_l=req.max_lattice)
    slice_finder.fit(updated_df[search_cols].to_numpy(), normalized_metric_col)

    if slice_finder.top_slices_ is None or slice_finder.top_slices_statistics_ is None:
        return SliceFinderReturn(slices=[], metrics=[], sizes=[], overall_metric=0)

    discovered_slices: List[Slice] = []
    slice_metrics: List[float] = []
    slice_sizes: List[int] = []
    search_cols = req.search_columns + req.search_columns_cont
    search_cols_len = len(req.search_columns)

    for sli_i, sli in enumerate(slice_finder.top_slices_):
        # Rescale back to original metric.
        if req.order_by == "ascending":
            slice_metrics.append(
                metric_max
                - slice_finder.top_slices_statistics_[sli_i]["slice_average_error"]
            )
        else:
            slice_metrics.append(
                slice_finder.top_slices_statistics_[sli_i]["slice_average_error"]
            )

        slice_sizes.append(slice_finder.top_slices_statistics_[sli_i]["slice_size"])

        predicate_list = []
        for pred_i, sli_predicate in enumerate(sli):
            if sli_predicate is not None:
                join_val = "" if len(predicate_list) == 0 else "&"

                # not continuous columns
                if pred_i < search_cols_len:
                    if str(sli_predicate) in ["True", "False"]:
                        sli_predicate = "true" if sli_predicate else "false"
                    predicate_list.append(
                        FilterPredicate(
                            column=req.search_columns[pred_i],
                            operation="==",
                            value=sli_predicate,
                            join=join_val,
                        )
                    )
                # continuous columns
                else:
                    col = req.search_columns_cont[pred_i - search_cols_len]
                    left_pred = FilterPredicate(
                        column=col,
                        operation=">=",
                        value=sli_predicate.left,
                        join="",
                    )
                    right_pred = FilterPredicate(
                        column=col,
                        operation="<",
                        value=sli_predicate.right,
                        join="&",
                    )
                    predicate_list.append(
                        FilterPredicateGroup(
                            predicates=[left_pred, right_pred], join=join_val
                        ),
                    )

        discovered_slices.append(
            Slice(
                slice_name="Generated Slice " + secrets.token_hex(nbytes=4),
                folder="",
                filter_predicates=FilterPredicateGroup(
                    predicates=predicate_list, join=""
                ),
            )
        )
    return SliceFinderReturn(
        slices=discovered_slices,
        metrics=slice_metrics,
        sizes=slice_sizes,
        overall_metric=slice_finder.average_error_
        if slice_finder.average_error_
        else 0,
    )
