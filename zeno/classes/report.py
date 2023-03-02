from enum import Enum
from typing import List, Union

from zeno.classes.base import CamelModel


class ChartType(str, Enum):
    BAR = "BAR"
    LINE = "LINE"
    TABLE = "TABLE"
    BEESWARM = "BEESWARM"


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str


class ReportEncoding(CamelModel):
    type: str  # slice/model
    selection: List[str]


class Report(CamelModel):
    name: str
    type: Union[ChartType, None] = None
    report_predicates: Union[List[ReportPredicate], None] = None
    x_encoding: Union[ReportEncoding, None] = None
    y_encoding: Union[ReportEncoding, None] = None
    color_encoding: Union[ReportEncoding, None] = None
