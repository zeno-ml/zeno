import torch
import os
from PIL import Image
from zeno import load_data, load_model, metric, slicer, transform


@load_model
def load_model(_):
    return torch.hub.load("ultralytics/yolov5", "yolov5s")


@load_data
def load_data(df_metadata, id_col, data_path):
    return [
        Image.open(os.path.join(data_path, img + ".jpg")) for img in df_metadata[id_col]
    ]


@slicer("accuracy")
def small_sample(data, _):
    return data.sample(10).index


@metric
def accuracy(output, metadata, label_col):
    return [1] * len(output)
