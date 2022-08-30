import os
from PIL import Image
from zeno import distill


def get_brightness(im: Image):
    im.thumbnail((32, 32))
    im_grey = im.convert("LA")  # convert to grayscale
    width, height = im.size

    total = 0
    for i in range(0, width):
        for j in range(0, height):
            total += im_grey.getpixel((i, j))[0]

    return total / (width * height)


@distill
def brightness(df, ops):
    imgs = [Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]]
    return [get_brightness(im) for im in imgs]
