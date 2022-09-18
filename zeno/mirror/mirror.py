from typing import List
from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache
from pandas import DataFrame
from umap import UMAP


class Mirror:
    def __init__(self, df: DataFrame, cache_path):
        self.df = df
        self.cache = ValueCache(cache_path, name="projection")
        self.reducer = None

    def project(self, model: str) -> List[List[float]]:
        def _umap():
            # extract data
            embed_col = ZenoColumn(column_type=ZenoColumnType.EMBEDDING, name=model)
            embed = self.df[str(embed_col)].tolist()

            # reduce high dim -> low dim
            projection = UMAP().fit_transform(embed).tolist()
            return projection

        # if not found will run the umap
        value = self.cache.get(default_func=_umap)
        return value
