import os
import cv2
from PIL import Image
from zeno import ZenoOptions, distill
import numpy as np


def get_imgs(df, ops: ZenoOptions):
    ret = []
    for img in df.index:
        im = cv2.imread(os.path.join(ops.data_path, img))
        im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
        im = cv2.resize(im, (224, 224))
        ret.append(im)
    return ret


@distill
def area(df, ops: ZenoOptions):
    ret = []
    for _, row in df.iterrows():
        label_path = os.path.join(ops.label_path, row[ops.label_column])
        label_img = cv2.imread(label_path, cv2.IMREAD_GRAYSCALE)
        label_img = cv2.resize(label_img, (224, 224))

        ret.append(np.where(label_img > 0, 1, 0).sum())
    return ret


@distill
def output_area(df, ops: ZenoOptions):
    ret = []
    for _, row in df.iterrows():
        label_path = os.path.join(ops.output_path, row[ops.output_column])
        label_img = cv2.imread(label_path, cv2.IMREAD_GRAYSCALE)
        label_img = cv2.resize(label_img, (224, 224))

        ret.append(np.where(label_img > 0, 1, 0).sum())
    return ret


@distill
def black_box(df, ops):
    """
    Detect if there is a black box at the bottom left
    """

    box_count = []
    imgs = get_imgs(df, ops)
    for img in imgs:
        # Get the image size
        height, width = img.shape[0:2]
        count = 0
        for x in range(0, 30):
            for y in range(200, height):
                if img[y][x][0] == 0:
                    count += 1
        if count == 720:
            box_count.append(1)
        else:
            box_count.append(0)

    return box_count


def get_brightness(im):
    im_grey = im.convert("LA")
    width, height = im.size

    total = 0
    for i in range(150, width - 150):
        for j in range(150, height - 150):
            total += im_grey.getpixel((i, j))[0]

    return total / (width * height)


@distill
def brightness(df, ops):
    imgs = [Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]]
    return [get_brightness(im) for im in imgs]
