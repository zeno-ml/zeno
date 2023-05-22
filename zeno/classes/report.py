from enum import Enum
from typing import List, Union

from zeno.classes.base import CamelModel


class ChartType(str, Enum):
    BAR = "BAR"
    LINE = "LINE"
    TABLE = "TABLE"
    BEESWARM = "BEESWARM"
    RADAR = "RADAR"
    HEATMAP = "HEATMAP"


class Parameters(CamelModel):
    x_encoding: str
    y_encoding: str
    z_encoding: str
    fixed_dimension: str
    second_slices: List[str]


class Report(CamelModel):
    name: str
    type: Union[ChartType, None] = None
    slices: Union[List[str], None] = None
    metrics: Union[List[str], None] = None
    models: Union[List[str], None] = None
    parameters: Union[Parameters, None] = None
