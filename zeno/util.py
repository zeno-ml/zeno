import dataclasses
import os
from importlib import util
from pathlib import Path
from typing import Tuple

import numpy as np

import pandas as pd
import pyarrow as pa  # type: ignore
from tqdm import trange  # type: ignore

from .api import ZenoOptions
from .classes import ZenoColumn, ZenoColumnType, ZenoFunction


def get_arrow_bytes(df, id_col):
    df[id_col] = df.index
    df = df.infer_objects()
    d = dict.fromkeys(df.select_dtypes(np.int64).columns, np.int32)
    df = df.astype(d)
    df_arrow = pa.Table.from_pandas(df)
    buf = pa.BufferOutputStream()
    with pa.ipc.new_file(buf, df_arrow.schema) as writer:
        writer.write_table(df_arrow)
    bs = bytes(buf.getvalue())
    return bs


def load_series(df, col_name, save_path):
    try:
        df.loc[:, col_name] = pd.read_pickle(save_path)
    except FileNotFoundError:
        df.loc[:, col_name] = pd.Series([pd.NA] * df.shape[0], index=df.index)


def get_function(fn: ZenoFunction):
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
            col.to_pickle(save_path)
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
                col.to_pickle(save_path)
    return (column, col)


def run_inference(
    model_loader: ZenoFunction,
    options: ZenoOptions,
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
        model=model_name,
        transform="",
    )
    embedding_col_obj = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING,
        name=model_name,
        model=model_name,
        transform="",
    )
    model_hash = str(model_col_obj)
    embedding_hash = str(embedding_col_obj)
    model_col = df[model_hash]
    embedding_col = df[embedding_hash]

    model_save_path = Path(cache_path, model_hash + ".pickle")
    embedding_save_path = Path(cache_path, embedding_hash + ".pickle")

    to_predict_indices = model_col.loc[pd.isna(model_col)].index

    if len(to_predict_indices) > 0:
        fn = model_loader_fn(model_path)
        if len(to_predict_indices) < batch_size:
            # TODO: check functions to see if they use output_path.
            file_cache_path = os.path.join(cache_path, model_hash)
            os.makedirs(file_cache_path, exist_ok=True)
            out = fn(
                df.loc[to_predict_indices],
                dataclasses.replace(options, output_path=file_cache_path),
            )

            # Check if we also get embedding
            if type(out) == tuple and len(out) == 2:
                for i, idx in enumerate(to_predict_indices):
                    model_col.at[idx] = out[0][i]
                    embedding_col.at[idx] = out[1][i]
                embedding_col.to_pickle(embedding_save_path)
                out = out[0]
            else:
                model_col[to_predict_indices] = out
            model_col.to_pickle(model_save_path)
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="Inference on " + model_name,
                position=pos,
            ):
                file_cache_path = os.path.join(cache_path, model_hash)

                os.makedirs(file_cache_path, exist_ok=True)
                out = fn(
                    df.loc[to_predict_indices[i : i + batch_size]],
                    dataclasses.replace(options, output_path=file_cache_path),
                )

                # Check if we also get embedding
                if type(out) == tuple and len(out) == 2:
                    for i, idx in enumerate(to_predict_indices[i : i + batch_size]):
                        model_col.at[idx] = out[0][i]
                        embedding_col.at[idx] = out[1][i]
                    embedding_col.to_pickle(embedding_save_path)
                    out = out[0]
                else:
                    model_col[to_predict_indices[i : i + batch_size]] = out
                model_col.to_pickle(model_save_path)
    return (model_col_obj, embedding_col_obj, model_col, embedding_col)


def postdistill_data(
    postprocessor: ZenoFunction,
    model: str,
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
        transform="",
    )
    col_hash = str(col_obj)
    col = df[col_hash]

    output_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=model,
        model=model,
        transform="",
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
            col.to_pickle(save_path)
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="postprocessing " + postprocessor.name,
                position=pos,
            ):
                out = postprocessor_fn(
                    df.loc[to_predict_indices[i : i + batch_size]], local_options
                )
                col.loc[to_predict_indices[i : i + batch_size]] = out
                col.to_pickle(save_path)
    return (col_obj, col)
