"""Internal classes for Zeno."""

from typing import List, Optional, Tuple, Union

from pydantic import BaseModel

from zeno.classes.base import CamelModel, ZenoColumn
from zeno.classes.slice import FilterIds, FilterPredicateGroup, Slice


class ZenoSettings(CamelModel):
    view: str
    id_column: ZenoColumn
    label_column: ZenoColumn
    data_column: ZenoColumn
    samples: int
    calculate_histogram_metrics: bool
    total_size: int


class ZenoVariables(CamelModel):
    metrics: List[str]
    models: List[str]
    folders: List[str]


class StatusResponse(CamelModel):
    status: str
    done_processing: bool
    complete_columns: List[ZenoColumn]


class MetricKey(CamelModel):
    sli: Slice
    model: str
    metric: str


class MetricRequest(CamelModel):
    metric_keys: List[MetricKey]
    tag_ids: Optional[FilterIds] = None
    filter_ids: Optional[FilterIds] = None
    tag_list: Optional[List[str]] = None


class TableRequest(CamelModel):
    columns: List[ZenoColumn]
    slice_range: List[int]
    filter_predicates: FilterPredicateGroup
    sort: Tuple[Union[ZenoColumn, None], bool]
    tag_ids: FilterIds
    filter_ids: Optional[FilterIds] = None
    tag_list: List[str]


class PlotRequest(CamelModel):
    filter_predicates: FilterPredicateGroup
    tag_ids: FilterIds


class EmbedProject2DRequest(CamelModel):
    model: str
    column: ZenoColumn


class ColorsProjectRequest(CamelModel):
    column: ZenoColumn


class EntryRequest(BaseModel):
    id: Union[int, str]
    columns: List[ZenoColumn] = []
