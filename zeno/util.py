import os
from inspect import signature
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd
from tqdm import trange  # type: ignore

# import pyarrow as pa  # type: ignore

from zeno.classes import Slice, Slicer  # type: ignore


def get_arrow_bytes(df, id_col):
    # df_arrow = pa.Table.from_pandas(df)
    # buf = pa.BufferOutputStream()
    # with pa.ipc.new_file(buf, df_arrow.schema) as writer:
    #     writer.write_table(df_arrow)
    # return bytes(buf.getvalue())
    df[id_col] = df.index
    js = df.to_json()
    return js


def cached_inference(
    df: pd.DataFrame,
    model_name: str,
    cache_path: str,
    fn: Callable,
    data_loader: Callable,
    data_path: str,
    batch_size: int,
):
    inference_column_name = "zenomodel_" + model_name
    embedding_column_name = "zenoembedding_" + model_name
    inference_path = os.path.join(cache_path, inference_column_name + ".pickle")
    embedding_path = os.path.join(inference_column_name + "_" + ".pickle")

    if inference_column_name not in df.columns:
        try:
            df.loc[:, inference_column_name] = pd.read_pickle(inference_path)
        except FileNotFoundError:
            df.loc[:, inference_column_name] = [pd.NA] * df.shape[0]

    if embedding_column_name not in df.columns:
        try:
            df.loc[:, embedding_column_name] = pd.read_pickle(embedding_path)
        except FileNotFoundError:
            df.loc[:, embedding_column_name] = [pd.NA] * df.shape[0]
    to_predict_indices = df.loc[pd.isna(df[inference_column_name]), :].index

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            data = data_loader(df.loc[to_predict_indices], data_path)
            out = fn(data)

            # Check if we also get embedding
            if type(out) == tuple and len(out) == 2:
                for i, idx in enumerate(to_predict_indices):
                    df.at[idx, inference_column_name] = out[0][i]
                    df.at[idx, embedding_column_name] = out[1][i]
                df[embedding_column_name].to_pickle(embedding_path)
                out = out[0]
            else:
                df.loc[to_predict_indices, inference_column_name] = out
            df[inference_column_name].to_pickle(inference_path)
        else:
            for i in trange(
                0, len(to_predict_indices), batch_size, desc="inference batches"
            ):
                data = data_loader(
                    df.loc[to_predict_indices[i : i + batch_size]],
                    data_path,
                )
                out = fn(data)

                if type(out) == tuple and len(out) == 2:
                    for i, idx in enumerate(to_predict_indices[i : i + batch_size]):
                        df.at[idx, inference_column_name] = out[0][i]
                        df.at[idx, embedding_column_name] = out[1][i]
                    df[embedding_column_name].to_pickle(embedding_path)
                else:
                    df.loc[
                        to_predict_indices[i : i + batch_size], inference_column_name
                    ] = out
                df[inference_column_name].to_pickle(inference_path)


# Used for preprocess and model outputs.
def cached_preprocess(
    df: pd.DataFrame,
    column_name: str,
    cache_path: Path,
    fn: Callable,
    data_loader: Callable,
    data_path: str,
    batch_size: int,
):
    if column_name not in df.columns:
        try:
            df.loc[:, column_name] = pd.read_pickle(cache_path)
        except FileNotFoundError:
            df.loc[:, column_name] = [pd.NA] * df.shape[0]
    to_predict_indices = df.loc[pd.isna(df[column_name]), :].index

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            data = data_loader(df.loc[to_predict_indices], data_path)
            out = fn(data)
            df.loc[to_predict_indices, column_name] = out
            df[column_name].to_pickle(cache_path)
        else:
            for i in trange(
                0, len(to_predict_indices), batch_size, desc="preprocessing batches"
            ):
                data = data_loader(
                    df.loc[to_predict_indices[i : i + batch_size]],
                    data_path,
                )
                out = fn(data)
                df.loc[to_predict_indices[i : i + batch_size], column_name] = out
                df[column_name].to_pickle(cache_path)


def slice_data(metadata: pd.DataFrame, slicer: Slicer, label_column: str):
    if len(signature(slicer.func).parameters) == 2:
        slicer_output = slicer.func(metadata, label_column)
    else:
        slicer_output = slicer.func(metadata)

    if isinstance(slicer_output, pd.DataFrame):
        slicer_output = slicer_output.index

    slices = {}
    # Can either be of the from [index list] or [(name, index list)..]
    if isinstance(slicer_output, pd.Index) and len(slicer_output) == 0:
        metadata.loc[:, "zenoslice_" + ".".join(slicer.name_list)] = pd.Series(
            np.zeros(len(metadata), dtype=int), dtype=int
        )
        slices[".".join(slicer.name_list)] = Slice(
            ".".join(slicer.name_list), "programmatic", slicer_output
        )
    elif (
        isinstance(slicer_output[0], tuple) or isinstance(slicer_output[0], list)
    ) and len(slicer_output) > 0:
        for output_slice in slicer_output:
            indices = output_slice[1]
            name_list = [*slicer.name_list, output_slice[0]]
            metadata.loc[:, "zenoslice_" + ".".join(name_list)] = pd.Series(
                np.zeros(len(metadata), dtype=int), dtype=int
            )
            metadata.loc[indices, "zenoslice_" + ".".join(name_list)] = 1
            slices[".".join(name_list)] = Slice(
                ".".join(name_list), "programmatic", indices
            )
    else:
        metadata.loc[:, "zenoslice_" + ".".join(slicer.name_list)] = pd.Series(
            np.zeros(len(metadata), dtype=int), dtype=int
        )
        metadata.loc[slicer_output, "zenoslice_" + ".".join(slicer.name_list)] = 1
        slices[".".join(slicer.name_list)] = Slice(
            ".".join(slicer.name_list), "programmatic", slicer_output
        )
    return slices
