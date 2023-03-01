from enum import Enum
from typing import List

from zeno.classes.base import CamelModel


class ReportType(str, Enum):
    BARCHART = "BARCHART"
    LINECHART = "LINECHART"
    TABLEVIEW = "TABLEVIEW"
    BEESWARM = "BEESWARM"


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str


class ReportEncoding(CamelModel):
    type: str  # slice/model
    selection: List[str]


class Report(CamelModel):
    name: str
    report_type: ReportType
    report_predicates: List[ReportPredicate]
    x_encoding: ReportEncoding
    y_encoding: ReportEncoding
    color_encoding: ReportEncoding
