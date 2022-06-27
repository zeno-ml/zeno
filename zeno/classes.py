from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel


def to_camel(string):
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class DistillFunction:
    def __init__(self, name: str, file_name: Path, fn_type: str):
        self.name = name
        self.file_name = file_name
        self.fn_type = fn_type


class PredictFunction:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class CamelModel(BaseModel):
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class FilterPredicate(CamelModel):
    name: str
    predicate_type: str
    operation: str
    value: str
    join: str
    group_indicator: Optional[str]


class Slice(CamelModel):
    slice_name: str
    filter_predicates: List[FilterPredicate]
    idxs: Optional[List[str]]


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str
    operation: str
    value: str


class Report(CamelModel):
    name: str
    report_predicates: List[ReportPredicate]


class ReportsRequest(CamelModel):
    reports: List[Report]


class ResultsRequest(BaseModel):
    slices: List[Slice]


class ProjectionRequest(BaseModel):
    model: str


class TableRequest(BaseModel):
    columns: List[str]
