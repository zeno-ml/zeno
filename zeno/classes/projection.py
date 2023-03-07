from typing import List, Union

from zeno.classes.base import CamelModel


class PointsColors(CamelModel):
    color: List[int]
    domain: List[Union[int, float, str]]
    # "nominal" or "continuous" or "boolean"
    data_type: str


class Points2D(CamelModel):
    x: List[float]
    y: List[float]
    color: List[int]
    opacity: List[int]
    ids: Union[List[int], List[str]]
    domain: List[Union[int, float, str]]
    # "nominal" or "continuous" or "boolean"
    data_type: str
