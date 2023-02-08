from typing import List, Optional, Union

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterIds, FilterPredicateGroup


class HistogramBucket(CamelModel):
    bucket: Union[bool, float, str]
    bucket_end: Union[bool, float, str, None] = None


class HistogramColumnRequest(CamelModel):
    column: ZenoColumn
    buckets: List[HistogramBucket]


class HistogramRequest(CamelModel):
    column_requests: List[HistogramColumnRequest]
    filter_predicates: Union[None, FilterPredicateGroup] = None
    model: Union[None, str] = None
    metric: Union[None, str] = None
    filter_ids: Optional[FilterIds] = None
