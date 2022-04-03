from zeno import load_model, load_data, metric
from PIL import Image
import os
import torch


# @load_model
# def load_model(model_path):
#     def pred(instances):
#         return [1] * len(instances)

#     return pred


@load_model
def torchhub(model_path):
    # Model
    if model_path == "yolov3":
        model = torch.hub.load(
            "ultralytics/yolov3", "yolov3"
        )  # or yolov3-spp, yolov3-tiny, custom
    elif model_path == "yolov5":
        model = torch.hub.load("ultralytics/yolov5", "yolov5s", force_reload=True)

    def pred(instances):
        results = model(instances).pred
        # Results
        res = []
        for r in results:
            r_temp = r.tolist()
            for ent in r_temp:
                del ent[4]
            res.append(r_temp)
        return res

    return pred


@load_data
def load_data(df_metadata, data_path):
    return [Image.open(os.path.join(data_path, img)) for img in df_metadata.index]


@metric
def accuracy(output, metadata, label_col):
    return [1] * len(output)
