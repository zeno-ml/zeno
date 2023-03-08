"""Parallel processing functions for distill and inference pipelines."""

import os
from inspect import getsource
from pathlib import Path
from typing import Callable, Tuple

import pandas as pd
from tqdm import trange

from zeno.api import DistillReturn, ModelReturn, ZenoOptions
from zeno.classes.base import ZenoColumn, ZenoColumnType


def predistill_data(
    fn: Callable[[pd.DataFrame, ZenoOptions], DistillReturn],
    column: ZenoColumn,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> Tuple[ZenoColumn, pd.Series]:
    col_hash = str(column)

    # To prevent SettingWithCopyWarning
    col = df[col_hash].copy()

    save_path = Path(cache_path, col_hash + ".pickle")
    to_predict_indices = col.loc[pd.isna(col)].index

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            out = fn(df.loc[to_predict_indices], options)
            col.loc[to_predict_indices] = out.distill_output
            col.to_pickle(str(save_path))
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="preprocessing " + fn.__name__,
                position=pos,
            ):
                out = fn(df.loc[to_predict_indices[i : i + batch_size]], options)
                col.loc[to_predict_indices[i : i + batch_size]] = out.distill_output
                col.to_pickle(str(save_path))
    return (column, col)


def run_inference(
    fn: Callable[[str], Callable[[pd.DataFrame, ZenoOptions], ModelReturn]],
    options: ZenoOptions,
    model_path: str,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> Tuple[ZenoColumn, ZenoColumn, pd.Series, pd.Series]:
    model_name = os.path.basename(model_path).split(".")[0]

    model_col_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=model_name,
    )
    embedding_col_obj = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING,
        name=model_name,
    )
    model_hash = str(model_col_obj)
    embedding_hash = str(embedding_col_obj)
    model_col = df[model_hash].copy()
    embedding_col = df[embedding_hash].copy()

    model_save_path = Path(cache_path, model_hash + ".pickle")
    embedding_save_path = Path(cache_path, embedding_hash + ".pickle")

    to_predict_indices = model_col.loc[pd.isna(model_col)].index

    if len(to_predict_indices) > 0:
        model_fn = fn(model_path)

        # Make output folder if function uses output_path
        src = getsource(model_fn)
        if "output_path" in src:
            file_cache_path = os.path.join(cache_path, model_hash)
            os.makedirs(file_cache_path, exist_ok=True)
            options = options.copy(update={"output_path": file_cache_path})

        if len(to_predict_indices) < batch_size:
            out = model_fn(df.loc[to_predict_indices], options)

            # Check if we also get embedding
            if out.embedding is not None:
                # Loop for setting since setting with loc and NDArray can cause issues.
                for i, idx in enumerate(to_predict_indices):
                    model_col.at[idx] = out.model_output[i]
                    embedding_col.at[idx] = out.embedding[i]
                embedding_col.to_pickle(str(embedding_save_path))
            else:
                model_col.loc[to_predict_indices] = out.model_output

            model_col.to_pickle(str(model_save_path))

        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="Inference on " + model_name,
                position=pos,
            ):
                out = model_fn(df.loc[to_predict_indices[i : i + batch_size]], options)

                # Check if we also get embedding
                if out.embedding is not None:
                    for i, idx in enumerate(to_predict_indices[i : i + batch_size]):
                        model_col.at[idx] = out.model_output[i]
                        embedding_col.at[idx] = out.embedding[i]

                    embedding_col.to_pickle(str(embedding_save_path))
                else:
                    model_col.loc[
                        to_predict_indices[i : i + batch_size]
                    ] = out.model_output

                model_col.to_pickle(str(model_save_path))

    return (model_col_obj, embedding_col_obj, model_col, embedding_col)


def postdistill_data(
    fn: Callable[[pd.DataFrame, ZenoOptions], DistillReturn],
    model: str,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
):
    col_obj = ZenoColumn(
        column_type=ZenoColumnType.POSTDISTILL,
        name=fn.__name__,
        model=model,
    )
    col_hash = str(col_obj)
    col = df[col_hash].copy()

    output_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=model,
    )
    output_hash = str(output_obj)

    save_path = Path(cache_path, col_hash + ".pickle")

    to_predict_indices = col.loc[pd.isna(col)].index

    local_options = options.copy(
        update={
            "output_column": output_hash,
            "output_path": os.path.join(cache_path, output_hash),
        }
    )

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            out = fn(df.loc[to_predict_indices], local_options)
            col.loc[to_predict_indices] = out.distill_output
            col.to_pickle(str(save_path))
        else:
            for i in trange(
                0,
                len(to_predict_indices),
                batch_size,
                desc="postprocessing " + fn.__name__ + " on " + model,
                position=pos,
            ):
                out = fn(df.loc[to_predict_indices[i : i + batch_size]], local_options)
                col.loc[to_predict_indices[i : i + batch_size]] = out.distill_output
                col.to_pickle(str(save_path))
    return (col_obj, col)
