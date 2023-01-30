"""Internal classes for Zeno."""

from typing import List, Optional, Tuple, Union

from pydantic import BaseModel

from zeno.classes.base import CamelModel, ZenoColumn

from zeno.classes.slice import FilterIds, FilterPredicate, FilterPredicateGroup, Slice


class ZenoSettings(CamelModel):
    view: str
    id_column: ZenoColumn
    label_column: ZenoColumn
    data_column: ZenoColumn
    data_origin: str
    metadata_columns: List[ZenoColumn]
    samples: int
    totalSize: int


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
    filter_ids: Optional[FilterIds] = None


class TableRequest(CamelModel):
    columns: List[ZenoColumn]
    slice_range: List[int]
    filter_predicates: List[Union[FilterPredicate, FilterPredicateGroup]]
    sort: Tuple[Union[ZenoColumn, None], bool]
    filter_ids: Optional[FilterIds] = None


class EmbedProject2DRequest(CamelModel):
    model: str
    column: ZenoColumn


class EntryRequest(BaseModel):
    id: str
    columns: List[ZenoColumn] = []
