from typing import List, Optional, Union

from zeno.classes.base import CamelModel, ZenoColumn


class FilterPredicate(CamelModel):
    column: ZenoColumn
    # ==, !=, >, <, >=, <=, match
    operation: str
    value: Union[str, float, int, bool]
    join: Optional[str]


class FilterPredicateGroup(CamelModel):
    predicates: List[Union["FilterPredicateGroup", FilterPredicate]]
    join: str


class FilterIds(CamelModel):
    ids: Union[List[int], List[str]]


class Slice(CamelModel):
    slice_name: str
    folder: str
    filter_predicates: FilterPredicateGroup


# Used for slices or tags
class GroupMetric(CamelModel):
    metric: Union[float, None]
    size: int
