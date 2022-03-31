from zeno import slicer
import numpy as np


def count_items(arr, idx):
    count = 0
    for a in arr:
        if a[4] == idx:
            count = count + 1
    return count


# @slicer
# def one_dog(df, label_col):
#     mask = df[label_col].apply(lambda x: count_items(x, 18) == 1)
#     return df[mask]


# @slicer
# def one_cat(df, label_col):
#     mask = df[label_col].apply(lambda x: count_items(x, 17) == 1)
#     return df[mask]


@slicer
def three_dogs(df, label_col):
    mask = df[label_col].apply(lambda x: count_items(x, 18) > 2)
    return df[mask]


# @slicer
# def multiple_cats(df):
#     mask = df["category_id"].apply(
#         lambda x: x is not None and len(x) > 1 and np.count_nonzero(x == 17) > 1
#     )
#     return df[mask]
