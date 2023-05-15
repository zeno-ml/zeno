from typing import List

import numpy as np
from sliceline.slicefinder import Slicefinder

from zeno.classes.slice import FilterPredicate, FilterPredicateGroup, Slice
from zeno.classes.slice_finder import SliceFinderRequest, SliceFinderReturn


def slice_finder(df, req: SliceFinderRequest):
    """Return slices of data with high or low metric values.

    Args:
        df (DataFrame): Zeno DataFrame with all metadata.
        req (SliceFinderRequest): Request with columns, metrics, and options.

    Returns a SliceFinderMetricReturn Object.
    """

    df = df[
        list(set([str(col) for col in req.columns] + [str(req.metric_column)]))
    ].dropna()
    metric_col = np.array(df[str(req.metric_column)], dtype=float)
    normalized_metric_col = (metric_col - np.min(metric_col)) / (
        np.max(metric_col) - np.min(metric_col)
    )
    if req.order_by == "ascending":
        normalized_metric_col = 1 - normalized_metric_col

    slice_finder = Slicefinder(alpha=0.1, k=10, max_l=req.depth, min_sup=0)
    slice_finder.fit(
        df[[str(col) for col in req.columns]].to_numpy(), normalized_metric_col
    )

    if slice_finder.top_slices_ is None:
        return SliceFinderReturn(slices=[], metrics=[])

    discovered_slices: List[Slice] = []
    slice_metrics: List[float] = []
    slice_sizes: List[int] = []
    for sli_i, sli in enumerate(slice_finder.top_slices_):
        predicate_list = []
        # TODO: add the metric calculated by sliceline.
        # slice_finder.top_slices_statistics_[] for slice_metrics and slice_sizes
        slice_metrics.append(0)
        for pred_i, sli_predicate in enumerate(sli):
            if sli_predicate is not None:
                join_val = "" if len(predicate_list) == 0 else "&"
                predicate_list.append(
                    FilterPredicate(
                        column=req.columns[pred_i],
                        operation="==",
                        value=sli_predicate,
                        join=join_val,
                    )
                )
        discovered_slices.append(
            Slice(
                slice_name="Slice " + str(sli_i),
                folder="",
                filter_predicates=FilterPredicateGroup(
                    predicates=predicate_list, join=""
                ),
            )
        )

    return SliceFinderReturn(slices=discovered_slices, metrics=slice_metrics, sizes=slice_sizes)
