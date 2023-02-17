import datetime
import os
import pickle
import sys
from contextlib import contextmanager
from importlib import util
from inspect import getmembers, isfunction
from pathlib import Path

import pandas as pd

from zeno.classes.base import MetadataType

VIEW_MAP_URL: str = "https://raw.githubusercontent.com/zeno-ml/instance-views/0.2/"
VIEWS_MAP_JSON: str = "views.json"


def read_pickle(file_name: str, cache_path: str, default):
    try:
        with open(os.path.join(cache_path, file_name), "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return default


def getMetadataType(col: pd.Series) -> MetadataType:
    try:
        datetime.datetime.fromisoformat(str(col[0]))
        return MetadataType.DATETIME
    except ValueError:
        pass

    if col.dtype == "bool":
        return MetadataType.BOOLEAN

    try:
        unique = col.unique().tolist()
    except TypeError:
        return MetadataType.OTHER

    if len(unique) < 21:
        return MetadataType.NOMINAL

    if col.dtype in [
        "int64",
        "int32",
        "int16",
        "int8",
        "Int64",
        "Int32",
        "Int16",
        "Int8",
        "uint64",
        "uint32",
        "uint16",
        "uint8",
        "Uint64",
        "Uint32",
        "Uint16",
        "Uint8",
        "float64",
        "float32",
        "float16",
        "float8",
        "Float64",
        "Float32",
        "Float16",
        "Float8",
    ]:
        return MetadataType.CONTINUOUS

    return MetadataType.OTHER


def load_series(df, col_name, save_path):
    try:
        series = pd.read_pickle(save_path)
        col_name.metadata_type = getMetadataType(series)
        df.loc[:, str(col_name)] = series
    except FileNotFoundError:
        df.loc[:, str(col_name)] = pd.Series([pd.NA] * df.shape[0], index=df.index)
    except EOFError:
        df.loc[:, str(col_name)] = pd.Series([pd.NA] * df.shape[0], index=df.index)


@contextmanager
def add_to_path(p):
    old_path = sys.path
    sys.path = sys.path[:]
    sys.path.insert(0, p)
    try:
        yield
    finally:
        sys.path = old_path


def parse_testing_file(test_file: Path):
    # To allow relative imports in test files,
    # add their directory to path temporarily.
    with add_to_path(os.path.dirname(os.path.abspath(test_file))):
        spec = util.spec_from_file_location(str(test_file), test_file)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore

    functions = []
    for func_name, func in getmembers(test_module):
        if isfunction(func):
            if (
                hasattr(func, "predict_function")
                or hasattr(func, "distill_function")
                or hasattr(func, "metric_function")
                or hasattr(func, "inference_function")
            ):
                functions.append(func)
    return functions


def is_notebook() -> bool:
    try:
        from IPython import get_ipython  # type: ignore

        shell = get_ipython().__class__.__name__
        if shell == "ZMQInteractiveShell":
            return True  # Jupyter notebook or qtconsole
        elif shell == "TerminalInteractiveShell":
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except (NameError, ImportError):
        return False  # Probably standard Python interpreter
