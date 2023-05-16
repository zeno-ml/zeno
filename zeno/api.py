"""External API for Zeno. Includes decorator functions, return types, and options."""

import functools
from typing import Any, Callable, Dict, List, Union

from numpy.typing import NDArray
from pandas import DataFrame, Series
from pydantic import BaseModel


class ZenoOptions(BaseModel):
    """Parameters passed to Zeno test functions.

    Args:
        id_column (str): Column in dataframe with unique identifiers.
        data_column (str): Column in dataframe with either raw data or path to data.
        label_column (str): Column in dataframe with
                            either raw labels or path to labels.
        output_column (str): Column in dataframe with a given
                             model's raw output or path to output
        data_path (str): Path to directory with data files.
        label_path (str): Path to directory with label files.
        output_path (str): Path to directory with a given model's output.
        distill_columns (map[str, str]): Map from distill function name to
        distill column.
    """

    id_column: str
    data_column: str
    label_column: str
    output_column: str
    distill_columns: Dict[str, str]
    data_path: str
    label_path: str
    output_path: str


class ZenoParameters(BaseModel):
    """Options passed to the backend processing pipeline."""

    metadata: Union[DataFrame, str]
    # If run from command line, config_file will be a path to a config file.
    config_file: str = ""
    functions: Union[List[Callable], str] = []
    view: str = ""
    models: List[str] = []
    id_column: str = ""
    data_column: str = ""
    label_column: str = ""
    data_path: str = ""
    label_path: str = ""
    batch_size: int = 1
    cache_path: str = ""
    calculate_histogram_metrics = True
    editable: bool = True
    multiprocessing: bool = True
    serve: bool = True
    samples: int = 30
    port: int = 8000
    host: str = "localhost"

    class Config:
        arbitrary_types_allowed = True


class ModelReturn(BaseModel):
    """Return type for model functions.

    Args:
        model_output (Series | List): Model output for each sample.
        embedding (Series | List[List[float]] | List[NDArray] | NDArray | None):
        High-dimensional embedding for each sample. Optional.
        other_returns (Dict[str, Series | List] | None): Other returns from the model
        to be shown as metadata columns in the UI.
    """

    model_output: Union[Series, List[Any]]
    embedding: Union[Series, List[List[float]], List[NDArray], NDArray, None] = None
    other_returns: Union[Dict[str, Union[Series, List[Any]]], None] = None

    class Config:
        arbitrary_types_allowed = True


class DistillReturn(BaseModel):
    """Return type for distill functions

    Args:
        distill_output (Series | List): Distill outputs for each sample.
    """

    distill_output: Union[Series, List[Any]]

    class Config:
        arbitrary_types_allowed = True


class MetricReturn(BaseModel):
    """Return type for metric functions.

    Args:
        metric (float): Average metric over subset of data
    """

    metric: float

    class Config:
        arbitrary_types_allowed = True


def model(func: Callable[[str], Callable[[DataFrame, ZenoOptions], ModelReturn]]):
    """Decorator function for model functions.

    Args:
        func (Callable[[str], Callable[[DataFrame, ZenoOptions], ModelReturn]]):
        A function that that takes a model name and returns a model function, which
        itself returns a function that takes a DataFrame and ZenoOptions and returns a
        ModelReturn.
    """

    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.predict_function = True  # type: ignore
    return _wrapper


def distill(func: Callable[[DataFrame, ZenoOptions], DistillReturn]):
    """Deocrator function for distill functions.

    Args:
        func (Callable[[DataFrame, ZenoOptions], DistillReturn]):
        A function that takes a DataFrame and ZenoOptions and returns a DistillReturn.
    """

    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.distill_function = True  # type: ignore
    return _wrapper


def metric(func: Callable[[DataFrame, ZenoOptions], MetricReturn]):
    """Decorator function for metric functions.

    Args:
        func (Callable[[DataFrame, ZenoOptions], MetricReturn]):
            A metric function that takes a DataFrame and ZenoOptions and
            returns a MetricReturn with an average metric value and optional error rate.
    """

    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric_function = True  # type: ignore
    return _wrapper
