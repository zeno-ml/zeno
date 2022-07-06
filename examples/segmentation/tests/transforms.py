import os

from PIL import Image, ImageFilter
from zeno import ZenoOptions, transform_function


@transform_function
def blur(df, ops: ZenoOptions):
    for img_path in df[ops.data_column]:
        img = Image.open(os.path.join(ops.data_path, img_path))
        blurred_img = img.filter(ImageFilter.BLUR)
        blurred_img.save(os.path.join(ops.output_path, "".join(img_path.split("/"))))
    return ["".join(x.split("/")) for x in list(df[ops.data_column])]
