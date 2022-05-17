from inspect import getsource
from pathlib import Path
from typing import Callable, Dict, List, Union

import pandas as pd
from pydantic import BaseModel


class ResultRequest(BaseModel):
    sli: str
    idxs: List[str]


class ResultsRequest(BaseModel):
    requests: List[ResultRequest]


class ProjectionRequest(BaseModel):
    model: str


class TableRequest(BaseModel):
    columns: List[str]


class Preprocessor:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class DataLoader:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class ModelLoader:
    def __init__(self, name: str, file_name: Path):
        self.name = name
        self.file_name = file_name


class Transform:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Metric:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Slice:
    def __init__(self, name: str, index: pd.Index):
        self.name = name
        self.index = index
        self.size = len(index)


class Slicer:
    def __init__(self, name: str, func: Callable, name_list: List[str]):
        self.name = name
        self.func = func
        self.name_list = name_list


class Result:
    def __init__(
        self,
        sli: str,
        transform: str,
        metric: str,
        slice_size: int,
    ):
        """A result is a slice of data, a transform, and a metric.

        Args:
            sli (str): The slice for this result.
            transform (str): The transform for this result.
            metric (str): The metric for this result.
            slice_size (int): _description_
        """
        self.sli = sli
        self.transform = transform
        self.metric = metric

        self.slice_size = slice_size

        # Keys are hash of model name
        self.model_names: List[str] = []
        self.model_metrics: Dict[str, float] = {}
        self.model_metric_outputs: Dict[str, list] = {}

        self.id: int = int(
            hash("".join("".join(d) for d in sli) + self.transform + self.metric)
            / 10000
        )

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
