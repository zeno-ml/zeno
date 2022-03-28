from zeno import slicer
import numpy as np


@slicer
def one_dog(df):
    mask = df["category_id"].apply(
        lambda x: x is not None and x is not None and np.count_nonzero(x == 18) == 1
    )
    return df[mask]


@slicer
def one_cat(df):
    mask = df["category_id"].apply(
        lambda x: x is not None and np.count_nonzero(x == 17) == 1
    )
    return df[mask]


@slicer
def multiple_dogs(df):
    mask = df["category_id"].apply(
        lambda x: x is not None and len(x) > 1 and np.count_nonzero(x == 18) > 1
    )
    return df[mask]


@slicer
def multiple_cats(df):
    mask = df["category_id"].apply(
        lambda x: x is not None and len(x) > 1 and np.count_nonzero(x == 17) > 1
    )
    return df[mask]
