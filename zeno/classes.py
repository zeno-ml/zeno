from inspect import getsource, signature
from pathlib import Path
from typing import Callable, Dict, List, Union

import pandas as pd
from pydantic import BaseModel


class SliceModel(BaseModel):
    name: List[str]


class ResultRequest(BaseModel):
    slices: List[List[str]]
    metric: str
    model: str
    transform: str


class AnalysisModel(BaseModel):
    requests: List[ResultRequest]


class Preprocessor:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Slice:
    def __init__(
        self,
        name: List[str],
        sliced_indices: pd.Index,
        size: int,
        slicer: str,
    ):
        self.name = name
        self.sliced_indices = sliced_indices
        self.size = size
        self.slicer = slicer


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


class Result:
    def __init__(
        self,
        sli: List[str],
        transform: str,
        metric: str,
        slice_size: int,
        model_names: List[Path],
    ):
        self.sli = sli
        self.transform = transform
        self.metric = metric
        self.slice_size = slice_size
        self.model_names = model_names

        # Keys are hash of model name
        self.model_metrics: Dict[str, float] = {}
        self.model_metric_outputs: Dict[str, list] = {}

        self.id: int = int(
            hash("".join(self.sli) + self.transform + self.metric) / 10000
        )

    def set_result(self, model_name: str, result: Union[pd.Series, list]):
        if isinstance(result, pd.Series):
            self.model_metric_outputs[model_name] = result.astype(int).to_list()
        elif len(result) > 0 and isinstance(result[0], bool):
            self.model_metric_outputs[model_name] = [
                1 if r is True else 0 for r in result
            ]

        self.model_metrics[model_name] = (
            sum(self.model_metric_outputs[model_name])
            / len(self.model_metric_outputs[model_name])
            * 100
        )

    def __hash__(self):
        return self.id


class Slicer:
    def __init__(self, name: str, func: Callable, name_list: List[str]):
        self.name = name
        self.func = func
        self.name_list = name_list

        self.source = getsource(self.func)
        self.slices: List[str] = []

    def slice_data(self, metadata: pd.DataFrame, label_column: str):
        if len(signature(self.func).parameters) == 2:
            slicer_output = self.func(metadata, label_column)
        else:
            slicer_output = self.func(metadata)

        if isinstance(slicer_output, pd.DataFrame):
            slicer_output = slicer_output.index

        slices_to_return = {}
        # Can either be of the from [index list] or [(name, index list)..]
        if (
            len(slicer_output) > 0
            and isinstance(slicer_output[0], tuple)
            or isinstance(slicer_output[0], list)
        ):
            for output_slice in slicer_output:
                indices = output_slice[1]
                # Join slice names with backslash
                name_list = [*self.name_list, output_slice[0]]
                self.slices.append("".join(name_list))
                slices_to_return["".join(name_list)] = Slice(
                    [*self.name_list, output_slice[0]],
                    indices,
                    len(indices),
                    self.name,
                )
        else:
            self.slices.append("".join(self.name_list))
            slices_to_return["".join(self.name_list)] = Slice(
                self.name_list,
                slicer_output,
                len(slicer_output),
                self.name,
            )

        return slices_to_return
