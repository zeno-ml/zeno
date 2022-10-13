from enum import Enum
from typing import List, Optional, Union

import numpy as np
from pandas import DataFrame
from sklearn.manifold import TSNE  # type: ignore

from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.mirror.cache import ValueCache
from zeno.mirror.sdm import domino


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


DEFAULT_PERPLEXITY = 30


class Mirror:
    def __init__(self, df: DataFrame, cache_path, id_column: ZenoColumn):
        self.df = df
        self.id_column = id_column
        self.cache_path = cache_path
        self.initialProjCache = ValueCache(path=cache_path, name="mirror_projection")
        self.status: Status = Status.IDLE

    def generate_slices(self, model: str = "", transform: str = ""):
        slices = domino(self.cache_path, self.df, num_slices=20)
        return slices

    def filterProject(
        self,
        model: str,
        ids: List[str],
        transform: str = "",
        perplexity: Optional[int] = DEFAULT_PERPLEXITY,
    ):
        projection = self._project(
            model,
            ids,
            transform=transform,
            perplexity=perplexity if perplexity is not None else DEFAULT_PERPLEXITY,
        )
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
        self,
        model: str,
        ids: Union[List[str], None] = None,
        transform: str = "",
        perplexity: int = DEFAULT_PERPLEXITY,
    ):
        """note that if ids is left set to None, the all embeddings are used"""

        if self.status == Status.RUNNING:
            raise RuntimeError("Projection already running")

        self.status = Status.RUNNING

        # cannot project 0 data samples
        # projecting nothing to nothing makes sense
        if ids is not None and len(ids) == 0:
            self.status = Status.IDLE
            return []

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

        # get past the issue of num embeddings < perplexity errors out
        # todo make this not tsne specific
        num_embed = embed.shape[0]
        perplexity = num_embed - 1 if num_embed < perplexity else perplexity

        # reduce high dim -> low dim
        reducer = TSNE(perplexity=perplexity)
        projection = reducer.fit_transform(embed).tolist()

        self.status = Status.IDLE

        return projection
