from importlib import import_module

from pandas import DataFrame
from typing import List

from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache
from enum import Enum


def umap(*args, **kwargs):
    umap_module = import_module("umap")
    return umap_module.UMAP(*args, **kwargs)


def df_rows_given_ids(df: DataFrame, idColumnPtr: ZenoColumn, ids: List[str]):
    found = df[idColumnPtr].isin(ids)
    return df[found]


class Status(Enum):
    IDLE = 0
    RUNNING = 1


class Mirror:
    def __init__(self, df: DataFrame, cache_path, id_column: ZenoColumn):
        self.df = df
        self.id_column = id_column
        self.cache = ValueCache(path=cache_path, name="mirror_projection")
        self.status: Status = Status.IDLE

    def project(self, model: str, ids: List[str]):
        if self.status == Status.RUNNING:
            raise RuntimeError("Projection already running")

        if not self.cache.exists():
            self.status = Status.RUNNING

            # if the ids were given, then use them!
            ids_given = ids is not None
            if ids_given:
                df_umap_input = df_rows_given_ids(self.df, self.id_column, ids)
            # otherwise, use the whole dataframe
            else:
                df_umap_input = self.df

            # extract embedding from df
            embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)
            embed = df_umap_input[str(embed_col)].tolist()

            # reduce high dim -> low dim
            reducer = umap()
            projection = reducer.fit_transform(embed).tolist()

            self.cache.set(projection)
            self.status = Status.IDLE

            return projection
        else:
            return self.cache.get()
