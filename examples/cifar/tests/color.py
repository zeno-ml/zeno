import colorsys
import os

import numpy as np
from PIL import Image
from zeno import distill_function
from zeno.api import ZenoOptions


def red_pixels(im):
    arr = np.array(im)
    count_red = 0
    for x in range(arr.shape[0]):
        for y in range(arr.shape[1]):
            if arr[x, y, 0] > 180 and arr[x, y, 1] < 70 and arr[x, y, 2] < 70:
                count_red += 1
    return count_red


def blue_border_pixels(im):
    arr = np.array(im)
    count_blue = 0
    for x in range(arr.shape[0]):
        for y in range(10):
            hsv = colorsys.rgb_to_hsv(arr[x, y, 0], arr[x, y, 1], arr[x, y, 2])
            if hsv[0] > 0.51 and hsv[0] < 0.72:
                count_blue += 1
    for x in range(arr.shape[0]):
        for y in range(arr.shape[1] - 10, arr.shape[1]):
            hsv = colorsys.rgb_to_hsv(arr[x, y, 0], arr[x, y, 1], arr[x, y, 2])
            if hsv[0] > 0.51 and hsv[0] < 0.72:
                count_blue += 1
    return count_blue


@distill_function
def red_count(df, ops: ZenoOptions):
    imgs = [Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]]
    return [red_pixels(im) for im in imgs]


@distill_function
def blue_border_count(df, ops):
    imgs = [Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]]
    return [blue_border_pixels(im) for im in imgs]
