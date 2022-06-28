import dataclasses
import os
from importlib import util
from pathlib import Path

import numpy as np

import pandas as pd
import pyarrow as pa  # type: ignore
from tqdm import trange  # type: ignore

from .api import ZenoOptions
from .classes import DistillFunction, PredictFunction


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
    # js = df.to_json()
    # return js


def load_series(df, col_name, save_path):
    try:
        df.loc[:, col_name] = pd.read_pickle(save_path)
    except FileNotFoundError:
        df.loc[:, col_name] = pd.Series([pd.NA] * df.shape[0], index=df.index)


def get_function(file_name, function_name):
    spec = util.spec_from_file_location("module.name", file_name)
    test_module = util.module_from_spec(spec)  # type: ignore
    spec.loader.exec_module(test_module)  # type: ignore
    return getattr(test_module, function_name)  # type: ignore


def predistill_data(
    preprocessor: DistillFunction,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
):
    preprocessor_fn = get_function(preprocessor.file_name, preprocessor.name)
    col_name = "zenopre_" + preprocessor.name
    col = df[col_name]

    save_path = Path(cache_path, col_name + ".pickle")
    to_predict_indices = col.loc[pd.isna(col)].index

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            out = preprocessor_fn(df.loc[to_predict_indices], options)
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
                out = preprocessor_fn(
                    df.loc[to_predict_indices[i : i + batch_size]], options
                )
                col.loc[to_predict_indices[i : i + batch_size]] = out
                col.to_pickle(save_path)
    return (col_name, col)


def postdistill_data(
    postprocessor: DistillFunction,
    model: str,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
):
    postprocessor_fn = get_function(postprocessor.file_name, postprocessor.name)
    col_name = "zenopost_" + model + "_" + postprocessor.name
    col = df[col_name]
    save_path = Path(cache_path, col_name + ".pickle")

    to_predict_indices = col.loc[pd.isna(col)].index

    local_options = dataclasses.replace(
        options,
        output_column="zenomodel_" + model,
        output_path=os.path.join(cache_path, "zenomodel_" + model),
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
    return (model + "_" + postprocessor.name, col)


def run_inference(
    model_loader: PredictFunction,
    options: ZenoOptions,
    model_path: str,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
):
    model_loader_fn = get_function(model_loader.file_name, model_loader.name)
    model_name = os.path.basename(model_path).split(".")[0]

    inference_save_path = Path(
        cache_path,
        "zenomodel_" + model_name + ".pickle",
    )
    embedding_save_path = Path(
        cache_path,
        "zenoembedding_" + model_name + ".pickle",
    )

    try:
        inference_col = pd.read_pickle(inference_save_path)
    except FileNotFoundError:
        inference_col = pd.Series([pd.NA] * df.shape[0], index=df.index)
    try:
        embedding_col = pd.read_pickle(embedding_save_path)
    except FileNotFoundError:
        embedding_col = pd.Series([pd.NA] * df.shape[0], index=df.index)

    to_predict_indices = inference_col.loc[pd.isna(inference_col)].index

    if len(to_predict_indices) > 0:
        fn = model_loader_fn(model_path)
        if len(to_predict_indices) < batch_size:
            # TODO: check functions to see if they use output_path.
            file_cache_path = os.path.join(cache_path, "zenomodel_" + model_name)
            os.makedirs(file_cache_path, exist_ok=True)
            out = fn(
                df.loc[to_predict_indices],
                dataclasses.replace(options, output_path=file_cache_path),
            )

            # Check if we also get embedding
            if type(out) == tuple and len(out) == 2:
                for i, idx in enumerate(to_predict_indices):
                    inference_col.at[idx] = out[0][i]
                    embedding_col.at[idx] = out[1][i]
                embedding_col.to_pickle(embedding_save_path)
                out = out[0]
            else:
                inference_col[to_predict_indices] = out
            inference_col.to_pickle(inference_save_path)
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="Inference on " + model_name,
                position=pos,
            ):
                file_cache_path = os.path.join(cache_path, "zenomodel_" + model_name)

                os.makedirs(file_cache_path, exist_ok=True)
                out = fn(
                    df.loc[to_predict_indices[i : i + batch_size]],
                    dataclasses.replace(options, output_path=file_cache_path),
                )

                # Check if we also get embedding
                if type(out) == tuple and len(out) == 2:
                    for i, idx in enumerate(to_predict_indices[i : i + batch_size]):
                        inference_col.at[idx] = out[0][i]
                        embedding_col.at[idx] = out[1][i]
                    embedding_col.to_pickle(embedding_save_path)
                    out = out[0]
                else:
                    inference_col[to_predict_indices[i : i + batch_size]] = out
                inference_col.to_pickle(inference_save_path)
    return (model_name, inference_col, embedding_col)
