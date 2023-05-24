from typing import List

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import Slice


class SliceFinderRequest(CamelModel):
    metric_column: ZenoColumn
    columns: List[ZenoColumn]
    order_by: str
    alpha: float
    minimum_supp: int


class SliceFinderReturn(CamelModel):
    slices: List[Slice]
    metrics: List[float]
    sizes: List[int]
    overall_metric: float
