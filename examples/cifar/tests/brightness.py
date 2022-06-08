import os

import PIL
from zeno import preprocess


def get_brightness(im):
    im_grey = im.convert("LA")
    width, height = im.size

    total = 0
    for i in range(0, width):
        for j in range(0, height):
            total += im_grey.getpixel((i, j))[0]

    return total / (width * height)


def get_border_brightness(im):
    im_grey = im.convert("LA")
    width, height = im.size

    total = 0
    for i in range(0, width):
        for j in range(0, 5):
            total += im_grey.getpixel((i, j))[0]

    for i in range(0, width):
        for j in range(height - 5, height):
            total += im_grey.getpixel((i, j))[0]

    return total / (width * 10)


@preprocess
def brightness(df, ops):
    imgs = [
        PIL.Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]
    ]
    return [get_brightness(im) for im in imgs]


@preprocess
def border_brightness(df, ops):
    imgs = [
        PIL.Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]
    ]
    return [get_border_brightness(im) for im in imgs]
