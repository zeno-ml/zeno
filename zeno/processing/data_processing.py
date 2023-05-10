"""Parallel processing functions for distill and inference pipelines."""

import os
from inspect import getsource
from pathlib import Path
from typing import Callable, Dict, List

import pandas as pd
from tqdm import trange

from zeno.api import DistillReturn, ModelReturn, ZenoOptions
from zeno.classes.base import DataProcessingReturn, ZenoColumn, ZenoColumnType
from zeno.util import load_series


def predistill_data(
    fn: Callable[[pd.DataFrame, ZenoOptions], DistillReturn],
    column: ZenoColumn,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> List[DataProcessingReturn]:
    col_hash = str(column)

    # To prevent SettingWithCopyWarning
    col = df[col_hash].copy()

    save_path = Path(cache_path, col_hash + ".pickle")
    to_predict_indices = col.loc[pd.isna(col)].index

    if len(to_predict_indices) > 0:
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

    return [DataProcessingReturn(column=column, output=col)]


def run_inference(
    fn: Callable[[str], Callable[[pd.DataFrame, ZenoOptions], ModelReturn]],
    options: ZenoOptions,
    model_name: str,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> List[DataProcessingReturn]:
    model_col_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT, name="output", model=model_name
    )
    embedding_col_obj = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING, name="embedding", model=model_name
    )
    model_hash = str(model_col_obj)
    embedding_hash = str(embedding_col_obj)
    model_col = df[model_hash].copy()
    embedding_col = df[embedding_hash].copy()

    model_save_path = Path(cache_path, model_hash + ".pickle")
    embedding_save_path = Path(cache_path, embedding_hash + ".pickle")

    to_predict_indices = model_col.loc[pd.isna(model_col)].index

    other_return_cols: Dict[str, ZenoColumn] = {}
    if len(to_predict_indices) > 0:
        model_fn = fn(model_name)

        # Make output folder if function uses output_path
        src = getsource(model_fn)
        if "output_path" in src:
            file_cache_path = os.path.join(cache_path, model_hash)
            os.makedirs(file_cache_path, exist_ok=True)
            options = options.copy(update={"output_path": file_cache_path})

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
                for j, idx in enumerate(to_predict_indices[i : i + batch_size]):
                    model_col.at[idx] = out.model_output[j]  # noqa: PD008
                    embedding_col.at[idx] = out.embedding[j]  # noqa: PD008

                embedding_col.to_pickle(str(embedding_save_path))
            else:
                model_col.loc[to_predict_indices[i : i + batch_size]] = out.model_output

            if out.other_returns is not None:
                for k, v in out.other_returns.items():
                    if i == 0:
                        postdistill_col_obj = ZenoColumn(
                            column_type=ZenoColumnType.POSTDISTILL,
                            name=k,
                            model=model_name,
                        )
                        other_return_cols[k] = postdistill_col_obj
                        if str(postdistill_col_obj) not in df.columns:
                            load_series(
                                df,
                                postdistill_col_obj,
                                Path(cache_path, str(postdistill_col_obj) + ".pickle"),
                            )

                    postdistill_col_obj = other_return_cols[k]
                    postdistill_hash = str(postdistill_col_obj)
                    postdistill_col = df[postdistill_hash].copy(deep=False)
                    postdistill_col.loc[
                        to_predict_indices[i : i + batch_size]
                    ] = out.other_returns[k]
                    postdistill_save_path = Path(
                        cache_path, postdistill_hash + ".pickle"
                    )
                    postdistill_col.to_pickle(str(postdistill_save_path))

            model_col.to_pickle(str(model_save_path))

    ret = [DataProcessingReturn(column=model_col_obj, output=model_col)]
    if not embedding_col.isna().to_numpy().any():  # type: ignore
        ret.append(DataProcessingReturn(column=embedding_col_obj, output=embedding_col))
    for k, v in other_return_cols.items():
        ret.append(DataProcessingReturn(column=v, output=df[str(v)]))

    return ret


def postdistill_data(
    fn: Callable[[pd.DataFrame, ZenoOptions], DistillReturn],
    model: str,
    options: ZenoOptions,
    cache_path: str,
    df: pd.DataFrame,
    batch_size: int,
    pos: int,
) -> List[DataProcessingReturn]:
    col_obj = ZenoColumn(
        column_type=ZenoColumnType.POSTDISTILL,
        name=fn.__name__,
        model=model,
    )
    col_hash = str(col_obj)
    col = df[col_hash].copy()

    output_obj = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT, name="output", model=model
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

    return [DataProcessingReturn(column=col_obj, output=col)]
