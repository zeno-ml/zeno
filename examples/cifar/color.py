from zeno import slicer, preprocess
import numpy as np
import colorsys


def red_pixels(im):
    arr = np.array(im)
    count_red = 0
    for x in range(arr.shape[0]):
        for y in range(arr.shape[1]):
            if arr[x, y, 0] > 180 and arr[x, y, 1] < 70 and arr[x, y, 2] < 70:
                count_red += 1
    return count_red


# def blue_border_pixels(im):
#     arr = np.array(im)
#     count_blue = 0
#     for x in range(arr.shape[0]):
#         for y in range(10):
#             if arr[x, y, 0] < 150 and arr[x, y, 1] < 200 and arr[x, y, 2] > 200:
#                 count_blue += 1
#     return count_blue


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


@preprocess
def red_count(images):
    return [red_pixels(im) for im in images]


@slicer
def red(df):
    return df[df["red_count"] > 20]


@preprocess
def blue_border_count(images):
    return [blue_border_pixels(im) for im in images]


@slicer
def blue_border(df):
    return df[df["blue_border_count"] > 600]
