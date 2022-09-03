import os

from torchvision.models import resnet18
from torchvision import transforms
import torch
import sys

from PIL import Image
import numpy as np
from zeno import model

preprocess = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)


def get_model(out_features=1, mode="tune", parent="pretrained", randomize=False):
    # Load the model
    model = resnet18(pretrained=(parent == "pretrained"))
    # Change the classification layer
    model.fc = torch.nn.Linear(in_features=512, out_features=out_features)
    # Load the in the parent model weights
    if parent != "pretrained":
        model.load_state_dict(torch.load(parent, map_location=torch.device("cpu")))
    if randomize:
        model.fc = torch.nn.Linear(in_features=512, out_features=out_features)
    # Setup the trainable parameters
    if mode == "tune":
        return model, model.parameters()
    elif mode == "transfer":
        for param in model.parameters():
            param.requires_grad = False
        model.fc.weight.requires_grad = True
        model.fc.bias.requires_grad = True
        return model, model.fc.parameters()
    elif mode == "eval":
        for param in model.parameters():
            param.requires_grad = False
        model.eval()
        return model
    else:
        print("ResNet.py: Could not determine trainable parameters")
        sys.exit(0)


classes = [
    "person",
    "bicycle",
    "car",
    "motorcycle",
    "airplane",
    "bus",
    "train",
    "truck",
    "boat",
    "traffic+light",
    "fire+hydrant",
    "stop+sign",
    "parking+meter",
    "bench",
    "bird",
    "cat",
    "dog",
    "horse",
    "sheep",
    "cow",
    "elephant",
    "bear",
    "zebra",
    "giraffe",
    "backpack",
    "umbrella",
    "handbag",
    "tie",
    "suitcase",
    "frisbee",
    "skis",
    "snowboard",
    "sports+ball",
    "kite",
    "baseball+bat",
    "baseball+glove",
    "skateboard",
    "surfboard",
    "tennis+racket",
    "bottle",
    "wine+glass",
    "cup",
    "fork",
    "knife",
    "spoon",
    "bowl",
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot+dog",
    "pizza",
    "donut",
    "cake",
    "chair",
    "couch",
    "potted+plant",
    "bed",
    "dining+table",
    "toilet",
    "tv",
    "laptop",
    "mouse",
    "remote",
    "keyboard",
    "cell+phone",
    "microwave",
    "oven",
    "toaster",
    "sink",
    "refrigerator",
    "book",
    "clock",
    "vase",
    "scissors",
    "teddy+bear",
    "hair+drier",
    "toothbrush",
]


# @model
# def load_model(model_path):
#     net = get_model(
#         out_features=80,
#         mode="eval",
#         parent="/Users/acabrera/dev-research/22-zeno/model.pt",
#     )

#     def pred(df, ops):
#         imgs = [
#             Image.open(os.path.join(ops.data_path, img)) for img in df[ops.data_column]
#         ]
#         imgs = torch.stack([preprocess(img) for img in imgs])
#         with torch.no_grad():
#             out = net(imgs)

#         return [
#             ",".join(list(map(lambda x: classes[x], np.argwhere(o > 0))))
#             for o in out.detach().numpy()
#         ]

#     return pred
