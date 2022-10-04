import dataclasses
import datetime
import os
import pickle
from contextlib import contextmanager
from importlib import util
from inspect import getsource
from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd  # type: ignore
import pyarrow as pa  # type: ignore
from tqdm import trange  # type: ignore

from zeno.api import ZenoOptions
from zeno.classes import MetadataType, ZenoColumn, ZenoColumnType, ZenoFunction


@contextmanager
def add_to_path(p):
    import sys

    old_path = sys.path
    sys.path = sys.path[:]
    sys.path.insert(0, p)
    try:
        yield
    finally:
        sys.path = old_path


def get_arrow_bytes(df, id_col):
    df.loc[:, id_col] = df.index
    df = df.infer_objects()
    d = dict.fromkeys(df.select_dtypes(np.int64).columns, np.int32)
    df = df.astype(d)
    df_arrow = pa.Table.from_pandas(df)
    buf = pa.BufferOutputStream()
    with pa.ipc.new_file(buf, df_arrow.schema) as writer:
        writer.write_table(df_arrow)
    bs = bytes(buf.getvalue())
    return bs


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

    if col.dtype == "int64" or col.dtype == "float64":
        return MetadataType.CONTINUOUS

    return MetadataType.OTHER


def load_series(df, col_name, save_path):
    try:
        df.loc[:, col_name] = pd.read_pickle(save_path)
    except FileNotFoundError:
        df.loc[:, col_name] = pd.Series([pd.NA] * df.shape[0], index=df.index)


def get_function(fn: ZenoFunction):
    # To allow relative imports in test files,
    # add their directory to path temporarily.
    with add_to_path(os.path.dirname(os.path.abspath(fn.file_name))):
        spec = util.spec_from_file_location("module.name", fn.file_name)
        test_module = util.module_from_spec(spec)  # type: ignore
        spec.loader.exec_module(test_module)  # type: ignore
        return getattr(test_module, fn.name)  # type: ignore


def predistill_data(
    preprocessor: ZenoFunction,
    column: ZenoColumn,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> Tuple[ZenoColumn, pd.Series]:
    fn = get_function(preprocessor)
    col_hash = str(column)
    col = df[col_hash]

    save_path = Path(cache_path, col_hash + ".pickle")
    to_predict_indices = col.loc[pd.isna(col)].index

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            out = fn(df.loc[to_predict_indices], options)
            col.loc[to_predict_indices] = out
            col.to_pickle(str(save_path))
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="preprocessing " + preprocessor.name,
                position=pos,
            ):
                out = fn(df.loc[to_predict_indices[i : i + batch_size]], options)
                col.loc[to_predict_indices[i : i + batch_size]] = out
                col.to_pickle(str(save_path))
    return (column, col)


def transform_data(
    transform: ZenoFunction,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> Tuple[ZenoColumn, pd.Series]:
    transform_fn = get_function(transform)
    transform_col = ZenoColumn(
        column_type=ZenoColumnType.TRANSFORM,
        name=transform.name,
    )
    col_hash = str(transform_col)
    col = df[col_hash]

    save_path = Path(cache_path, col_hash + ".pickle")
    src = getsource(transform_fn)
    transform_cache_path = ""
    if "output_path" in src:
        transform_cache_path = os.path.join(cache_path, col_hash)
        os.makedirs(transform_cache_path, exist_ok=True)

    to_transform_indices = col.loc[pd.isna(col)].index

    if len(to_transform_indices) > 0:
        if len(to_transform_indices) < batch_size:
            out = transform_fn(
                df.loc[to_transform_indices],
                dataclasses.replace(options, output_path=transform_cache_path),
            )
            col.loc[to_transform_indices] = out
            col.to_pickle(str(save_path))
        else:
            for i in trange(
                0,
                len(to_transform_indices),
                batch_size,
                desc="transforming " + transform.name,
                position=pos,
            ):
                out = transform_fn(
                    df.loc[to_transform_indices[i : i + batch_size]],
                    dataclasses.replace(options, output_path=transform_cache_path),
                )
                col.loc[to_transform_indices[i : i + batch_size]] = out
                col.to_pickle(str(save_path))
    return (transform_col, col)


def run_inference(
    model_loader: ZenoFunction,
    options: ZenoOptions,
    transform: str,
    model_path: str,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> Tuple[ZenoColumn, ZenoColumn, pd.Series, pd.Series]:
    model_loader_fn = get_function(model_loader)
    model_name = os.path.basename(model_path).split(".")[0]

    model_col_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=model_name,
        transform=transform,
    )
    embedding_col_obj = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING,
        name=model_name,
        transform=transform,
    )
    model_hash = str(model_col_obj)
    embedding_hash = str(embedding_col_obj)
    model_col = df[model_hash]
    embedding_col = df[embedding_hash]

    model_save_path = Path(cache_path, model_hash + ".pickle")
    embedding_save_path = Path(cache_path, embedding_hash + ".pickle")

    to_predict_indices = model_col.loc[pd.isna(model_col)].index

    # If transform, pass transform data
    if len(transform) != 0:
        transform_data_col = ZenoColumn(
            column_type=ZenoColumnType.TRANSFORM,
            name=transform,
        )
        transform_col_name = str(transform_data_col)
        transform_path = os.path.join(cache_path, transform_col_name)
        options = dataclasses.replace(
            options, data_path=transform_path, data_column=transform_col_name
        )

    if len(to_predict_indices) > 0:
        fn = model_loader_fn(model_path)
        if len(to_predict_indices) < batch_size:
            # Make output folder if function uses output_path
            src = getsource(fn)
            if "output_path" in src:
                file_cache_path = os.path.join(cache_path, model_hash)
                os.makedirs(file_cache_path, exist_ok=True)
                options = dataclasses.replace(options, output_path=file_cache_path)

            out = fn(df.loc[to_predict_indices], options)

            # Check if we also get embedding
            if type(out) == tuple and len(out) == 2:
                for i, idx in enumerate(to_predict_indices):
                    model_col.at[idx] = out[0][i]
                    embedding_col.at[idx] = out[1][i]
                embedding_col.to_pickle(str(embedding_save_path))
                out = out[0]
            else:
                model_col[to_predict_indices] = out

            model_col.to_pickle(str(model_save_path))

        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="Inference on " + model_name + " with " + transform,
                position=pos,
            ):

                # Make output folder if function uses output_path
                src = getsource(fn)
                if "output_path" in src:
                    file_cache_path = os.path.join(cache_path, model_hash)
                    os.makedirs(file_cache_path, exist_ok=True)
                    options = dataclasses.replace(options, output_path=file_cache_path)

                out = fn(df.loc[to_predict_indices[i : i + batch_size]], options)

                # Check if we also get embedding
                if type(out) == tuple and len(out) == 2:
                    for i, idx in enumerate(to_predict_indices[i : i + batch_size]):
                        model_col.at[idx] = out[0][i]
                        embedding_col.at[idx] = out[1][i]
                    embedding_col.to_pickle(str(embedding_save_path))
                    out = out[0]
                else:
                    model_col.loc[to_predict_indices[i : i + batch_size]] = out

                model_col.to_pickle(str(model_save_path))

    return (model_col_obj, embedding_col_obj, model_col, embedding_col)


def postdistill_data(
    postprocessor: ZenoFunction,
    model: str,
    transform: str,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
):
    postprocessor_fn = get_function(postprocessor)
    col_obj = ZenoColumn(
        column_type=ZenoColumnType.POSTDISTILL,
        name=postprocessor.name,
        model=model,
        transform=transform,
    )
    col_hash = str(col_obj)
    col = df[col_hash]

    output_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=model,
        transform=transform,
    )
    output_hash = str(output_obj)

    save_path = Path(cache_path, col_hash + ".pickle")

    to_predict_indices = col.loc[pd.isna(col)].index

    local_options = dataclasses.replace(
        options,
        output_column=output_hash,
        output_path=os.path.join(cache_path, output_hash),
    )
    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            out = postprocessor_fn(df.loc[to_predict_indices], local_options)
            col.loc[to_predict_indices] = out
            col.to_pickle(str(save_path))
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="postprocessing "
                + postprocessor.name
                + " on "
                + model
                + " with "
                + transform,
                position=pos,
            ):
                out = postprocessor_fn(
                    df.loc[to_predict_indices[i : i + batch_size]], local_options
                )
                col.loc[to_predict_indices[i : i + batch_size]] = out
                col.to_pickle(str(save_path))
    return (col_obj, col)
