import os

import torch
import torchvision.transforms as transforms
from PIL import Image
from zeno import model 

from cifar_model import *

transform_image = transforms.Compose(
    [transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]
)

classes = (
    "airplane",
    "automobile",
    "bird",
    "cat",
    "deer",
    "dog",
    "frog",
    "horse",
    "ship",
    "truck",
)


@model
def load_model(model_path):
    net = Net()
    net.load_state_dict(torch.load(model_path))

    def pred(df, ops):
        imgs = [
            Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]
        ]
        imgs = torch.stack([transform_image(img) for img in imgs])
        with torch.no_grad():
            out, emb = net(imgs)
        return [
            classes[i] for i in torch.argmax(out, dim=1).detach().numpy()
        ], emb.detach().numpy()

    return pred
