from inspect import getsource
from pathlib import Path
from typing import Callable, Dict, List, Optional, Union

import pandas as pd
from pydantic import BaseModel


def to_camel(string):
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


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
    name: str
    predicates: List[FilterPredicate]
    idxs: Optional[List[str]]


class ResultsRequest(BaseModel):
    slices: List[Slice]


class ProjectionRequest(BaseModel):
    model: str


class TableRequest(BaseModel):
    columns: List[str]


class Preprocessor:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class Postprocessor:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class ModelLoader:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class Metric:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Result:
    def __init__(
        self,
        sli: str,
        metric: str,
        slice_size: int,
    ):
        """A result is a slice of data and a metric.

        Args:
            sli (str): The slice for this result.
            metric (str): The metric for this result.
            slice_size (int): _description_
        """
        self.sli = sli
        self.metric = metric

        self.slice_size = slice_size

        # Keys are hash of model name
        self.model_names: List[str] = []
        self.model_metrics: Dict[str, float] = {}
        self.model_metric_outputs: Dict[str, list] = {}

        self.id: int = int(hash("".join("".join(d) for d in sli) + self.metric) / 10000)

    def set_result(self, model_name: str, result: Union[pd.Series, list]):
        if model_name not in self.model_names:
            self.model_names.append(model_name)

        if isinstance(result, pd.Series):
            self.model_metric_outputs[model_name] = result.astype(int).to_list()
        elif len(result) > 0 and isinstance(result[0], bool):
            self.model_metric_outputs[model_name] = [
                1 if r is True else 0 for r in result
            ]
        elif len(result) > 0 and isinstance(result[0], int):
            self.model_metric_outputs[model_name] = result
        else:
            self.model_metric_outputs[model_name] = []

        if len(self.model_metric_outputs[model_name]) == 0:
            self.model_metrics[model_name] = 0
        else:
            self.model_metrics[model_name] = (
                sum(self.model_metric_outputs[model_name])
                / len(self.model_metric_outputs[model_name])
                * 100
            )

    def __hash__(self):
        return self.id
