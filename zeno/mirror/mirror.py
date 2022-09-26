from enum import Enum
from importlib import import_module

import numpy as np
from pandas import DataFrame
from sklearn.manifold import TSNE
from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache


def umap(*args, **kwargs):
    umap_module = import_module("umap")
    return umap_module.UMAP(*args, **kwargs)


class Status(Enum):
    IDLE = 0
    RUNNING = 1


class Mirror:
    def __init__(self, df: DataFrame, cache_path):
        self.df = df
        self.cache = ValueCache(path=cache_path, name="mirror_projection")
        self.status: Status = Status.IDLE

    def project(self, model: str):
        if self.status == Status.RUNNING:
            raise RuntimeError("Projection already running")

        if not self.cache.exists():
            self.status = Status.RUNNING

            # extract data
            embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)
            embed = np.stack(self.df[str(embed_col)].to_numpy(), axis=0)

            # reduce high dim -> low dim
            # reducer = umap()
            reducer = TSNE()
            projection = reducer.fit_transform(embed).tolist()

            self.cache.set(projection)
            self.status = Status.IDLE

            return projection
        else:
            return self.cache.get()
