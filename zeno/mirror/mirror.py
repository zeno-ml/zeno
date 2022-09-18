from importlib import import_module

from pandas import DataFrame

from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache


def umap(*args, **kwargs):
    umap_module = import_module("umap")
    return umap_module.UMAP(*args, **kwargs)


class Mirror:
    def __init__(self, df: DataFrame, cache_path):
        self.df = df
        self.cache = ValueCache(path=cache_path, name="mirror_projection")

    def project(self, model: str):
        if not self.cache.exists():
            # extract data
            embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)
            embed = self.df[str(embed_col)].tolist()

            # reduce high dim -> low dim
            reducer = umap()
            projection = reducer.fit_transform(embed).tolist()
            self.cache.set(projection)
            return projection
        else:
            return self.cache.get()
