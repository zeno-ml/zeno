import datetime
import json
import os
import pickle
import sys
from contextlib import contextmanager
from importlib import util
from inspect import getmembers, isfunction
from pathlib import Path

import numpy as np
import pandas as pd  # type: ignore

from zeno.classes import MetadataType


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            # 👇️ alternatively use str()
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


def read_pickle(file_name: str, cache_path: Path, default):
    try:
        with open(os.path.join(cache_path, file_name), "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return default


def getMetadataType(col: pd.Series) -> MetadataType:
    col = col.infer_objects()

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
        "uint64",
        "uint32",
        "uint16",
        "uint8",
        "float64",
        "float32",
        "float16",
        "float8",
    ]:
        return MetadataType.CONTINUOUS

    return MetadataType.OTHER


def load_series(df, col_name, save_path):
    try:
        df.loc[:, col_name] = pd.read_pickle(save_path)
    except FileNotFoundError:
        df.loc[:, col_name] = pd.Series([pd.NA] * df.shape[0], index=df.index)


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
                or hasattr(func, "transform_function")
                or hasattr(func, "metric_function")
            ):
                functions.append(func)
    return functions
