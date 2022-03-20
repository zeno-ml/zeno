import os
from pathlib import Path
from typing import Callable, Union

import pandas as pd
import pyarrow as pa  # type: ignore
from watchdog.events import FileSystemEventHandler  # type: ignore


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


class TestFileUpdateHandler(FileSystemEventHandler):
    def __init__(self, files, callback):
        self.files = files
        self.callback = callback

    def on_modified(self, event):
        if os.path.abspath(event.src_path) in self.files:
            self.callback()
