from typing import List, Union

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterPredicateGroup


class HistogramBucket(CamelModel):
    bucket: Union[int, float, str, bool]
    bucket_end: Union[int, float, str, bool, None] = None


class HistogramColumnRequest(CamelModel):
    column: ZenoColumn
    buckets: List[HistogramBucket]


class HistogramRequest(CamelModel):
    column_requests: List[HistogramColumnRequest]
    filter_predicates: Union[None, FilterPredicateGroup] = None
    model: Union[None, str] = None
    metric: Union[None, str] = None
