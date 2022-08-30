import functools
from dataclasses import dataclass
from typing import Dict


@dataclass
class ZenoOptions:
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


def model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.predict_function = True
    return _wrapper


def distill(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.distill_function = True
    return _wrapper


def transform(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.transform_function = True
    return _wrapper


def metric(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric_function = True
    return _wrapper
