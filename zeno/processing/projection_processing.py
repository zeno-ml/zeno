from typing import List

import numpy as np
import pandas as pd
from sklearn import preprocessing

from zeno.classes.base import MetadataType, ZenoColumn, ZenoColumnType
from zeno.classes.projection import Points2D, PointsColors


def check_embed_exists(df: pd.DataFrame, model: str):
    """Checks for the existence of an embedding column.
    Returns True if the column exists, False otherwise
    """
    embed_column = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING, name="embedding", model=model
    )
    exists = str(embed_column) in df.columns
    return exists and not df[str(embed_column)].isna().any()


cached_projections = {}


def run_tsne(df: pd.DataFrame, model: str) -> np.ndarray:
    """Project embedding into 2D space using t-SNE.

    Args:
        df (pd.DataFrame): Zeno DataFrame.
        model (str): Name of which model to use for the embedding.

    Returns:
        np.ndarray: 2D projection of the embedding.
    """

    if model in cached_projections:
        return cached_projections[model]

    from openTSNE import TSNE

    embed_col = ZenoColumn(
        column_type=ZenoColumnType.EMBEDDING, name="embedding", model=model
    )

    embed = df[str(embed_col)].to_numpy()
    embed = np.stack(embed, axis=0)  # type: ignore

    all_available_processors = -1
    default_iterations = 400
    tsne = TSNE(n_jobs=all_available_processors, n_iter=default_iterations)
    projection = tsne.fit(embed)

    cached_projections[model] = projection

    return projection


def projection_colors(df: pd.DataFrame, column: ZenoColumn) -> PointsColors:
    """Get colors for a projection based on a column.

    Args:
            df (pd.DataFrame): Dataframe with all columns from Zeno.
            column (ZenoColumn): Column to use for coloring the projection.

    Returns:
            PointsColors: The color range, the unique values, and the metadata type.
    """
    series = df[str(column)]
    unique = series.unique()
    metadata_type = "nominal"
    color_range: List[int] = []
    if len(unique) == 2:
        metadata_type = "boolean"
    if len(unique) > 10:
        if column.metadata_type == MetadataType.CONTINUOUS:
            metadata_type = "continuous"
            color_range = (
                np.interp(series, (series.min(), series.max()), (0, 20))
                .astype(int)
                .tolist()
            )
            unique = np.array([series.min(), series.max()])
        else:
            metadata_type = "other"
            color_range = [0] * len(series)
    else:
        labels = preprocessing.LabelEncoder().fit_transform(series)
        if isinstance(labels, np.ndarray):
            color_range = labels.astype(int).tolist()
        else:
            color_range = [0] * len(series)

    return PointsColors(
        color=color_range, domain=unique.tolist(), data_type=metadata_type
    )


def project_into_2d(
    df: pd.DataFrame, id_column: ZenoColumn, model: str, column: ZenoColumn
) -> Points2D:
    """If the embedding exists, will use t-SNE to project into 2D."""

    points = Points2D(x=[], y=[], color=[], domain=[], opacity=[], data_type="", ids=[])

    # Can't project without an embedding
    if not check_embed_exists(df, model):
        return points

    projection = run_tsne(df, model)

    # extract points and ids from computed projection
    points.x = projection[:, 0].tolist()
    points.y = projection[:, 1].tolist()
    color_results = projection_colors(df, column)
    points.color = color_results.color
    points.domain = color_results.domain
    points.data_type = color_results.data_type
    points.ids = df[str(id_column)].to_list()

    return points
