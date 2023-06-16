from typing import List, Optional

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterIds, FilterPredicateGroup, Slice


class SliceFinderRequest(CamelModel):
    metric_column: ZenoColumn
    search_columns: List[ZenoColumn]
    order_by: str
    alpha: float
    max_lattice: int
    compare_column: Optional[ZenoColumn] = None
    filter_predicates: Optional[FilterPredicateGroup] = None
    tag_ids: Optional[FilterIds] = None
    filter_ids: Optional[FilterIds] = None
    tag_list: Optional[List[str]] = None


class SliceFinderReturn(CamelModel):
    slices: List[Slice]
    metrics: List[float]
    sizes: List[int]
    overall_metric: float
