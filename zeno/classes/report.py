from enum import Enum
from typing import List, Union

from zeno.classes.base import CamelModel
from zeno.classes.slice import Slice


class ChartType(str, Enum):
    BAR = "BAR"
    LINE = "LINE"
    TABLE = "TABLE"
    BEESWARM = "BEESWARM"


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str


class Parameters(CamelModel):
    x_encoding: str
    y_encoding: str
    color_encoding: str


class Report(CamelModel):
    name: str
    type: Union[ChartType, None] = None
    slices: Union[List[Slice], None] = None
    metrics: Union[List[str], None] = None
    models: Union[List[str], None] = None
    parameters: Union[Parameters, None] = None
    fixed_dimension: Union[str, None] = None
