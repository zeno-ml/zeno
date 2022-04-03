from zeno import slicer, preprocess
import numpy as np


def red_pixels(im):
    arr = np.array(im)
    count_red = 0
    for x in range(arr.shape[0]):
        for y in range(arr.shape[1]):
            if arr[x, y, 0] > 180 and arr[x, y, 1] < 70 and arr[x, y, 2] < 70:
                count_red += 1
    return count_red


@preprocess
def red_count(images):
    return [red_pixels(im) for im in images]


@slicer
def red(df):
    return df[df["red_count"] > 20]
