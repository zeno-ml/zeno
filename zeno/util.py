import os
from typing import Any, Callable, Union

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
    data_loader: Callable,
    df: pd.DataFrame,
    fn: Callable,
    cache,
    batch_size: int,
    id_column: str,
    data_path: str,
    transform: Union[Callable, None] = None,
):
    final_outputs: Any = [None] * df.shape[0]
    to_output = []
    outputs = []

    # Get all instances from cache possible
    for i, inst in enumerate(list(df[id_column])):
        if transform:
            inst = inst + "_T"
        if inst in cache:
            final_outputs[i] = cache[inst]
        else:
            to_output.append(i)

    if len(to_output) > 0:
        if len(to_output) < batch_size:
            data = data_loader(df.iloc[to_output], id_column, data_path)
            if transform:
                data = transform(data)
            outputs = fn(data)
        else:
            for i in range(0, len(to_output), batch_size):
                data = data_loader(
                    df.iloc[to_output[i : i + batch_size]], id_column, data_path
                )
                if transform:
                    data = transform(data)
                outputs.extend(fn(data))

        j = 0
        for i, inst in enumerate(final_outputs):
            if inst is None:
                final_outputs[i] = outputs[j]
                if transform:
                    cache[df.iloc[i][id_column] + "_T"] = final_outputs[i]
                else:
                    cache[df.iloc[i][id_column]] = final_outputs[i]

                j = j + 1

    return final_outputs


class TestFileUpdateHandler(FileSystemEventHandler):
    def __init__(self, files, callback):
        self.files = files
        self.callback = callback

    def on_modified(self, event):
        if os.path.abspath(event.src_path) in self.files:
            self.callback()
