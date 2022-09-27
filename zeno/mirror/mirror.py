from enum import Enum
from typing import List, Union

import numpy as np
from pandas import DataFrame
from sklearn.manifold import TSNE  # type: ignore

from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache


def df_rows_given_ids(
    df: DataFrame, idColumnPtr: ZenoColumn, ids: Union[List[str], None]
):
    if ids is None:
        return df
    found = df[str(idColumnPtr)].isin(ids)
    return df[found]


class Status(Enum):
    IDLE = 0
    RUNNING = 1


class Mirror:
    def __init__(self, df: DataFrame, cache_path, id_column: ZenoColumn):
        self.df = df
        self.id_column = id_column
        self.cache_path = cache_path
        self.initialProjCache = ValueCache(path=cache_path, name="mirror_projection")
        self.status: Status = Status.IDLE

    def filterProject(self, model: str, ids: List[str], transform: str = ""):
        projection = self._project(model, ids, transform=transform)
        return projection

    def initProject(self, model: str, transform: str = ""):
        self.initialProjCache = ValueCache(
            path=self.cache_path, name=f"mirror_{model}{transform}"
        )
        if not self.initialProjCache.exists():
            all = None  # nerf or nothin :P
            projection = self._project(model, ids=all, transform=transform)
            self.initialProjCache.set(projection)
            return projection
        else:
            return self.initialProjCache.get()

    def _project(
        self, model: str, ids: Union[List[str], None] = None, transform: str = ""
    ):
        """note that if ids is left set to None, the all embeddings are used"""

        if self.status == Status.RUNNING:
            raise RuntimeError("Projection already running")

        self.status = Status.RUNNING

        # if the ids were given, then use them!
        ids_given = ids is not None
        if ids_given:
            df_input = df_rows_given_ids(self.df, self.id_column, ids)
        # otherwise, use the whole dataframe
        else:
            df_input = self.df

        # extract data
        embed_col = ZenoColumn(
            column_type=ZenoColumnType.EMBEDDING, name=model, transform=transform
        )
        embed_expanded = df_input[str(embed_col)].to_numpy()
        embed = np.stack(embed_expanded, axis=0)  # type: ignore

        # reduce high dim -> low dim
        # reducer = umap()
        reducer = TSNE()
        projection = reducer.fit_transform(embed).tolist()

        self.status = Status.IDLE

        return projection
