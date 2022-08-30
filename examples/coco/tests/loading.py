from zeno import model, metric, ZenoOptions
from PIL import Image
import os
import torch


@model
def torchhub(model_path):
    # Model
    if model_path == "yolov3":
        model = torch.hub.load(
            "ultralytics/yolov3", "yolov3"
        )  # or yolov3-spp, yolov3-tiny, custom
    elif model_path == "yolov5":
        model = torch.hub.load("ultralytics/yolov5", "yolov5s", force_reload=True)

    def pred(df, ops: ZenoOptions):
        imgs = [
            Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]
        ]
        results = model(imgs).pred
        # Results
        res = []
        for r in results:
            r_temp = r.tolist()
            for ent in r_temp:
                del ent[4]
            res.append(r_temp)
        return res

    return pred


@metric
def accuracy(df, ops):
    return [1] * len(df)
