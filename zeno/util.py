import datetime
import os
import pickle
import shutil
import sys
from contextlib import contextmanager
from importlib import util
from inspect import getmembers, isfunction
from pathlib import Path
from typing import Any, Callable, Dict, List, Union

import pandas as pd
import requests
import tomli

from zeno.api import ZenoParameters
from zeno.classes.base import MetadataType

VIEW_MAP_URL: str = "https://raw.githubusercontent.com/zeno-ml/instance-views/0.3/"
VIEWS_MAP_JSON: str = "views.json"


def read_pickle(file_name: str, cache_path: str, default):
    try:
        with open(os.path.join(cache_path, file_name), "rb") as f:
            return pickle.load(f)
    except FileNotFoundError:
        return default


def get_metadata_type(col: pd.Series) -> MetadataType:
    try:
        datetime.datetime.fromisoformat(str(col[0]))
        return MetadataType.DATETIME
    except ValueError:
        pass

    if col.dtype == "bool" or col.dtype == "boolean":
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
        col_name.metadata_type = get_metadata_type(series)
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


def read_config(args: Union[str, Dict, ZenoParameters]) -> ZenoParameters:
    params: ZenoParameters

    if isinstance(args, str):
        path = os.path.abspath(args)
        try:
            with open(path, "rb") as f:
                args_dict = tomli.load(f)
        except Exception:
            print("ERROR: Failed to read TOML configuration file.")
            sys.exit(1)

        params = ZenoParameters.parse_obj(args_dict)
        params.config_file = path

        # Change working directory to the directory of the config file.
        os.chdir(os.path.dirname(path))

    elif isinstance(args, dict):
        params = ZenoParameters.parse_obj(args)
    elif isinstance(args, ZenoParameters):
        params = args
    else:
        sys.exit(1)

    if params.cache_path == "":
        params.cache_path = "./.zeno_cache/"
    else:
        params.cache_path = params.cache_path
    os.makedirs(params.cache_path, exist_ok=True)

    # Try to get view from GitHub List, if not try to read from path and copy it.
    if params.view != "":
        view_dest_path = Path(os.path.join(params.cache_path, "view.mjs"))
        view_path = Path(params.view)
        if view_path.is_file():
            if view_dest_path.is_file():
                os.remove(view_dest_path)
            shutil.copyfile(view_path, view_dest_path)
        else:
            try:
                views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
                views = views_res.json()
                url = VIEW_MAP_URL + views[params.view]
                with open(view_dest_path, "wb") as out_file:
                    content = requests.get(url, stream=True).content
                    out_file.write(content)
            except KeyError:
                print(
                    "ERROR: View not found in list or relative path."
                    " See available views at ",
                    "https://github.com/zeno-ml/instance-views/blob/main/views.json",
                )
                sys.exit(1)

    if params.id_column == "":
        print(
            "WARNING: no id_column specified, using index as id_column. If you are",
            "using a data_column, suggest using it as id_column.",
        )

    return params


def read_metadata(meta: Union[str, pd.DataFrame]) -> pd.DataFrame:
    """Return DataFrame or try to read it from file"""
    if isinstance(meta, pd.DataFrame):
        return meta
    elif isinstance(meta, str):
        meta_path = Path(os.path.realpath(meta))

        if meta_path.suffix == ".csv":
            return pd.read_csv(meta_path)
        elif meta_path.suffix == ".tsv":
            return pd.read_csv(
                meta_path, sep="\t", header=0, quoting=3, keep_default_na=False
            )
        elif meta_path.suffix == ".parquet":
            return pd.read_parquet(meta_path)
        elif meta_path.suffix == ".jsonl":
            return pd.read_json(meta_path, lines=True)

    print(
        "ERROR: Failed to read metadata file "
        + meta
        + "\n Should be one of .csv, .jsonl, or .parquet"
    )
    sys.exit(1)


def load_function(test_file: Path) -> List[Callable[..., Any]]:
    # To allow relative imports in test files,
    # add their directory to path temporarily.
    with add_to_path(os.path.dirname(os.path.abspath(test_file))):
        spec = util.spec_from_file_location(str(test_file), test_file)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore

    functions: List[Callable[..., Any]] = []
    for _, func in getmembers(test_module):
        if isfunction(func):
            if (
                hasattr(func, "predict_function")
                or hasattr(func, "distill_function")
                or hasattr(func, "metric_function")
            ):
                functions.append(func)
    return functions


def read_functions(fns: Union[List[Callable], str]) -> List[Callable]:
    if isinstance(fns, list):
        return fns
    elif isinstance(fns, str):
        fn_path = Path(os.path.realpath(fns))
        if os.path.isfile(fn_path):
            return load_function(fn_path)
        elif os.path.exists(fn_path):
            # Add directory with tests to path for relative imports.
            fns = []
            for f in list(fn_path.rglob("*.py")):
                fns = fns + load_function(f)
            return fns
    return []


def is_notebook() -> bool:
    try:
        from IPython import get_ipython

        shell = get_ipython().__class__.__name__
        if shell == "ZMQInteractiveShell":
            return True  # Jupyter notebook or qtconsole
        elif shell == "TerminalInteractiveShell":
            return False  # Terminal running IPython
        else:
            return False  # Other type (?)
    except (NameError, ImportError):
        return False  # Probably standard Python interpreter
