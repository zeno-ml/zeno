"""External API for Zeno."""

import functools
from typing import Callable, Dict, List, Union

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
        distill_columns (map[str, str]): Map from distiller name to distill column.
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

    metadata: DataFrame
    view: str = ""
    functions: List[Callable] = []
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
    serve: bool = True
    samples: int = 30
    port: int = 8000
    host: str = "localhost"

    class Config:
        arbitrary_types_allowed = True


class ZenoModelBatch:
    """ZenoModelBatch
    Save the results from a batch of predictions from the @model decorator callback
    return value

    Example:
        return ModelBatch().save_predictions([])
                           .save_embeddings([])
                           .save_other("times", [])
                           .save_other("confidences", [])
    """

    def __init__(self):
        self._predictions: Union[List, Series, None] = None
        self._embeddings: Union[List, Series, None] = None
        self._other: Dict[str, Union[List, Series]] = {}

    def save_predictions(self, predictions: Union[List, Series]):
        self._predictions = predictions
        return self

    def save_embeddings(self, embeddings: Union[List, Series]):
        self._embeddings = embeddings
        return self

    def save_other(self, column_name: str, data: Union[List, Series]):
        self._other[column_name] = data
        return self


def model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.predict_function = True  # type: ignore
    return _wrapper


def distill(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.distill_function = True  # type: ignore
    return _wrapper


def metric(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric_function = True  # type: ignore
    return _wrapper


def inference(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.inference_function = True  # type: ignore
    return _wrapper
