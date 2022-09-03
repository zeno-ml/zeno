import os

import cv2
import numpy as np
import segmentation_models as sm
from sklearn.metrics import jaccard_score
from zeno import ZenoOptions, distill, metric, model

BACKBONE = "efficientnetb3"
preprocess = sm.get_preprocessing(BACKBONE)


def get_imgs(df, ops: ZenoOptions):
    ret = []
    for img in df.index:
        im = cv2.imread(os.path.join(ops.data_path, img))
        im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
        im = cv2.resize(im, (224, 224))
        ret.append(im)
    return ret


def get_img(row, ops: ZenoOptions):
    im = cv2.imread(os.path.join(ops.data_path, row[ops.data_column]))
    im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    im = cv2.resize(im, (224, 224))
    return im


@model
def load_model(model_path):
    loaded_model = sm.Unet(BACKBONE)
    loaded_model.load_weights(model_path)

    def pred(df, ops: ZenoOptions):
        preds = []

        for idx, row in df.iterrows():
            # im = preprocess(img)
            img = get_img(row, ops)
            im = np.expand_dims(img, axis=0)
            pred = loaded_model.predict(im).round()
            save_name = row[ops.id_column].split("/")[-1]
            cv2.imwrite(
                os.path.join(ops.output_path, save_name),
                pred[..., 0].squeeze() * 225,
            )
            preds.append(save_name)
        return preds

    return pred


@distill
def iou(df, ops: ZenoOptions):
    outs = []
    for _, row in df.iterrows():
        label_path = os.path.join(ops.label_path, row[ops.label_column])
        label_img = cv2.imread(label_path, cv2.IMREAD_GRAYSCALE)
        label_img = cv2.resize(label_img, (224, 224))
        output_path = os.path.join(ops.output_path, row[ops.output_column])
        output_img = cv2.imread(output_path, cv2.IMREAD_GRAYSCALE)
        output_img = cv2.resize(output_img, (224, 224))
        out = jaccard_score(
            np.where(label_img > 0, 1, 0),
            np.where(output_img > 0, 1, 0),
            average="micro",
        )
        outs.append(out)
    return outs


@metric
def average_iou(df, ops: ZenoOptions):
    return df[ops.distill_columns["iou"]].mean()
