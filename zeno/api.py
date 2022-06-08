import functools
from dataclasses import dataclass


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
        data_type (str): Either "raw" or "path".
        output_type (str): Either "raw" or "path".
        data_path (str): Path to directory with data, concatenated with
                         data_column for 'path' data_type.
        output_path (str): Path to directory with a given model's output, concatenated
                           with output_column for 'path' data_type
    """

    id_column: str
    data_column: str
    label_column: str
    output_column: str
    data_type: str
    output_type: str
    data_path: str
    output_path: str


def load_model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.load_model = True
    return _wrapper


def preprocess(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.preprocess = True
    return _wrapper


def postprocess(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.postprocess = True
    return _wrapper


def metric(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric = True
    return _wrapper
