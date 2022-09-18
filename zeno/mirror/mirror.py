from importlib import import_module
from typing import List
from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache
from pandas import DataFrame


def umap(*args, **kwargs):
    umap_module = import_module("umap")
    UMAP = umap_module.parametric_umap.UMAP
    return UMAP(*args, **kwargs)


class Mirror:
    def __init__(self, df: DataFrame, cache_path):
        self.df = df
        self.cache = ValueCache(cache_path, name="projection")

    def project(self, model: str) -> List[List[float]]:
        def _umap():
            # extract data
            embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)
            embed = self.df[str(embed_col)].tolist()

            # reduce high dim -> low dim
            reducer = umap()
            projection = reducer.fit_transform(embed).tolist()
            return projection

        # if not found will run the umap
        value = self.cache.get(default_func=_umap)
        return value
