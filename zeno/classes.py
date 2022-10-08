from enum import IntEnum
from pathlib import Path
from typing import List, Optional, Union

from pydantic import BaseModel


class ZenoColumnType(IntEnum):
    METADATA = 0
    PREDISTILL = 1
    OUTPUT = 2
    EMBEDDING = 3
    POSTDISTILL = 4
    TRANSFORM = 5
    WEAK_LABEL = 6


class ZenoFunctionType(IntEnum):
    PREDICTION = 0
    PREDISTILL = 1
    POSTDISTILL = 2
    TRANSFORM = 3
    METRIC = 4


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


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str
    transform: str


class Report(CamelModel):
    name: str
    report_type: str
    report_predicates: List[ReportPredicate]


class ZenoFunction(CamelModel):
    name: str
    file_name: Path
    fn_type: ZenoFunctionType


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
    value: str
    join: str
    group_indicator: Optional[str]


class FilterPredicateGroup(CamelModel):
    predicates: List[Union[FilterPredicate, "FilterPredicateGroup"]]
    join: str


class ZenoSettings(CamelModel):
    view: str
    id_column: ZenoColumn
    label_column: ZenoColumn
    data_column: ZenoColumn
    metadata_columns: List[ZenoColumn]
    samples: int


class ZenoVariables(CamelModel):
    metrics: List[str]
    transforms: List[str]
    models: List[str]
    folders: List[str]


class Slice(CamelModel):
    slice_name: str
    folder: str
    filter_predicates: Optional[FilterPredicateGroup]
    idxs: Optional[List[str]]


class MetricKey(CamelModel):
    sli: Slice
    metric: str
    model: str
    transform: str


class StatusResponse(CamelModel):
    status: str
    done_processing: bool
    complete_columns: List[ZenoColumn]


class MirrorProject(BaseModel):
    model: str
    transform: str = ""
    ids: Optional[List[str]] = None
    perplexity: Optional[int] = 30
