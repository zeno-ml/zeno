from inspect import signature
from pathlib import Path
from typing import Callable, Union

import numpy as np
import pandas as pd
import pyarrow as pa  # type: ignore

from zeno.classes import Slice, Slicer  # type: ignore


def get_arrow_bytes(df):
    df_arrow = pa.Table.from_pandas(df)
    buf = pa.BufferOutputStream()
    with pa.ipc.new_file(buf, df_arrow.schema) as writer:
        writer.write_table(df_arrow)
    return bytes(buf.getvalue())


# Used for preprocess and model outputs.
def cached_process(
    df: pd.DataFrame,
    ids: pd.Index,
    column_name: str,
    cache_path: Path,
    fn: Callable,
    data_loader: Callable,
    data_path: str,
    batch_size: int,
    transform: Union[Callable, None] = None,
):
    if column_name not in df.columns:
        try:
            df.loc[:, column_name] = pd.read_pickle(cache_path)
        except FileNotFoundError:
            df.loc[:, column_name] = [pd.NA] * df.shape[0]

    to_predict_indices = df.loc[pd.isna(df[column_name]), :].index.intersection(ids)

    if len(to_predict_indices) > 0:
        if len(to_predict_indices) < batch_size:
            data = data_loader(df.loc[to_predict_indices], data_path)
            if transform:
                data = transform(data)
            df.loc[to_predict_indices, column_name] = fn(data)
            df[column_name].to_pickle(cache_path)
        else:
            for i in range(0, len(to_predict_indices), batch_size):
                data = data_loader(
                    df.loc[to_predict_indices[i : i + batch_size]],
                    data_path,
                )
                if transform:
                    data = transform(data)
                df.loc[to_predict_indices[i : i + batch_size], column_name] = fn(data)
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
    if (
        len(slicer_output) > 0
        and isinstance(slicer_output[0], tuple)
        or isinstance(slicer_output[0], list)
    ):
        for output_slice in slicer_output:
            indices = output_slice[1]
            name_list = [*slicer.name_list, output_slice[0]]
            arr = np.zeros(len(metadata), dtype=int)
            arr[indices] = 1
            metadata.loc[:, "zenoslice_" + "".join(slicer.name_list)] = pd.Series(
                np.zeros(len(metadata)), dtype=int
            )
            metadata.loc[:, "zenoslice_" + "".join(slicer.name_list)] = 1
            slices["".join(name_list)] = Slice([name_list], slicer_output)
    else:
        metadata.loc[:, "zenoslice_" + "".join(slicer.name_list)] = pd.Series(
            np.zeros(len(metadata), dtype=int), dtype=int
        )
        metadata.loc[slicer_output, "zenoslice_" + "".join(slicer.name_list)] = 1
        slices["".join(slicer.name_list)] = Slice([slicer.name_list], slicer_output)
    return slices
