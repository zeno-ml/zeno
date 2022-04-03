import PIL
from zeno import slicer, transform, preprocess


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
def brightness(images):
    return [get_brightness(im) for im in images]


@preprocess
def border_brightness(images):
    return [get_border_brightness(im) for im in images]


@slicer
def low_exposure(metadata):
    return metadata[metadata["brightness"] < 80].index


@slicer
def high_exposure(metadata):
    return metadata[metadata["brightness"] > 200].index


@slicer
def white_border(metadata):
    return metadata[metadata["border_brightness"] > 150].index


@transform
def blur(data):
    return [img.filter(PIL.ImageFilter.BLUR) for img in data]


@transform
def rotate(data):
    return [img.rotate(90, PIL.Image.NEAREST, expand=1) for img in data]
