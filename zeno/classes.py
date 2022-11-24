from enum import IntEnum
from typing import List, Optional, Tuple, Union

from pydantic import BaseModel


class ZenoColumnType(IntEnum):
    METADATA = 0
    PREDISTILL = 1
    OUTPUT = 2
    EMBEDDING = 3
    POSTDISTILL = 4
    TRANSFORM = 5
    WEAK_LABEL = 6


class MetadataType(IntEnum):
    NOMINAL = 0
    CONTINUOUS = 1
    BOOLEAN = 2
    DATETIME = 3
    OTHER = 4


def to_camel(string):
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class ZenoState(CamelModel):
    model: str
    metric: str
    transform: str


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str
    transform: str


class Report(CamelModel):
    name: str
    report_type: str
    report_predicates: List[ReportPredicate]


class ZenoColumn(CamelModel):
    column_type: ZenoColumnType
    name: str
    metadata_type: Optional[MetadataType] = MetadataType.OTHER
    model: Optional[str] = ""
    transform: Optional[str] = ""

    def __str__(self):
        m = ""
        t = ""
        if self.model is not None:
            m = self.model
        if self.transform is not None:
            t = self.transform
        return str(int(self.column_type)) + self.name + m + t


class FilterPredicate(CamelModel):
    column: ZenoColumn
    operation: str
    value: Union[str, float, int, bool]
    join: Optional[str]


class FilterPredicateGroup(CamelModel):
    predicates: List[Union[FilterPredicate, "FilterPredicateGroup"]]
    join: str


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
    transforms: List[str]
    models: List[str]
    folders: List[str]


class Slice(CamelModel):
    slice_name: str
    folder: str
    filter_predicates: FilterPredicateGroup


class MetricKey(CamelModel):
    sli: Slice
    state: ZenoState


class HistogramRequest(CamelModel):
    columns: List[ZenoColumn]
    state: ZenoState
    get_metrics: bool
    filter_predicates: List[Union[FilterPredicate, FilterPredicateGroup]]


class TableRequest(CamelModel):
    columns: List[ZenoColumn]
    slice_range: List[int]
    filter_predicates: List[Union[FilterPredicate, FilterPredicateGroup]]
    sort: Tuple[Union[ZenoColumn, None], bool]


class StatusResponse(CamelModel):
    status: str
    done_processing: bool
    complete_columns: List[ZenoColumn]


class MirrorProject(BaseModel):
    model: str
    transform: str = ""
    ids: Optional[List[str]] = None
    perplexity: Optional[int] = 30
