from typing import List, Optional, Union

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterIds, FilterPredicateGroup


class HistogramBucket(CamelModel):
    bucket: Union[float, bool, int, str]
    bucket_end: Union[float, bool, int, str, None] = None


class HistogramColumnRequest(CamelModel):
    column: ZenoColumn
    buckets: List[HistogramBucket]


class HistogramRequest(CamelModel):
    column_requests: List[HistogramColumnRequest]
    filter_predicates: Union[None, FilterPredicateGroup] = None
    model: Union[None, str] = None
    metric: Union[None, str] = None
    tag_ids: Optional[FilterIds] = None
    filter_ids: Optional[FilterIds] = None
    tag_list: Optional[List[str]] = None


class StringFilterRequest(CamelModel):
    column: ZenoColumn
    filter_string: str
    is_regex: bool
    case_match: bool
    whole_word_match: bool
