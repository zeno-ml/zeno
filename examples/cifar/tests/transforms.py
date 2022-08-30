import os

from PIL import Image, ImageFilter
from zeno import ZenoOptions, transform


@transform
def blur(df, ops: ZenoOptions):
    for img_path in df[ops.data_column]:
        img = Image.open(os.path.join(ops.data_path, img_path))
        blurred_img = img.filter(ImageFilter.BLUR)
        blurred_img.save(os.path.join(ops.output_path, "".join(img_path.split("/"))))
    return ["".join(x.split("/")) for x in list(df[ops.data_column])]


@transform
def rotate(df, ops: ZenoOptions):
    for img_path in df[ops.data_column]:
        img = Image.open(os.path.join(ops.data_path, img_path))
        rot_img = img.rotate(90)
        rot_img.save(os.path.join(ops.output_path, "".join(img_path.split("/"))))
    return ["".join(x.split("/")) for x in list(df[ops.data_column])]
