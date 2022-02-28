import os
from typing import Any, Callable, List

from watchdog.events import FileSystemEventHandler  # type: ignore


def cached_model(
    data: List[Any],
    data_ids: List[int],
    model_cache,
    model: Callable,
    batch_size: int,
):
    outputs: Any = [None] * len(data_ids)
    to_predict = []
    predicted = []

    # Get all instances from cache possible
    for i, inst in enumerate(data_ids):
        if inst in model_cache:
            outputs[i] = model_cache.get(inst)
        else:
            to_predict.append(data[i])

    if len(to_predict) > 0:
        if len(to_predict) < batch_size:
            predicted = model(to_predict)
        else:
            for i in range(0, len(to_predict), batch_size):
                predicted.extend(model(to_predict[i : i + batch_size]))

        j = 0
        for i, inst in enumerate(outputs):
            if inst is None:
                outputs[i] = predicted[j]
                model_cache[data_ids[i]] = outputs[i]
                j = j + 1

    return outputs


class TestFileUpdateHandler(FileSystemEventHandler):
    def __init__(self, files, callback):
        self.files = files
        self.callback = callback

    def on_modified(self, event):
        if os.path.abspath(event.src_path) in self.files:
            self.callback()
