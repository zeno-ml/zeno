from typing import List, Optional, Union

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterIds, FilterPredicateGroup


class HistogramBucket(CamelModel):
    bucket: Union[int, float, bool, str]
    bucket_end: Union[int, float, bool, str, None] = None


class HistogramColumnRequest(CamelModel):
    column: ZenoColumn
    buckets: List[HistogramBucket]


class HistogramRequest(CamelModel):
    column_requests: List[HistogramColumnRequest]
    filter_predicates: Union[None, FilterPredicateGroup] = None
    model: Union[None, str] = None
    metric: Union[None, str] = None
    filter_ids: Optional[FilterIds] = None


class StringFilterRequest(CamelModel):
    column: ZenoColumn
    filter_string: str
    selection_type: str
