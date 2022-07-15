from enum import IntEnum
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel


def to_camel(string):
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class ZenoColumnType(IntEnum):
    METADATA = 0
    PREDISTILL = 1
    OUTPUT = 2
    EMBEDDING = 3
    POSTDISTILL = 4
    TRANSFORM = 5


class ZenoFunctionType(IntEnum):
    PREDICTION = 0
    PREDISTILL = 1
    POSTDISTILL = 2
    TRANSFORM = 3
    METRIC = 4


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str
    transform: str
    operation: str
    value: str
    results: List[int]


class Report(CamelModel):
    name: str
    report_predicates: List[ReportPredicate]


class ZenoFunction(CamelModel):
    name: str
    file_name: Path
    fn_type: ZenoFunctionType


class ZenoColumn(CamelModel):
    column_type: ZenoColumnType
    name: str
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


class ZenoSettings(CamelModel):
    view: str
    id_column: ZenoColumn
    label_column: ZenoColumn
    data_column: ZenoColumn
    metadata_columns: List[ZenoColumn]


class Slice(CamelModel):
    slice_name: str
    filter_predicates: Optional[List[FilterPredicate]]
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


class TableRequest(BaseModel):
    columns: List[ZenoColumn]


class ReportsRequest(CamelModel):
    reports: List[Report]


class MetricsRequest(BaseModel):
    requests: List[MetricKey]


class ProjectionRequest(BaseModel):
    model: str
    instance_ids: List[str]
