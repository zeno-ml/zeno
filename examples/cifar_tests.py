import PIL
import torch
import torch.nn as nn
import torch.nn.functional as F
import os
import torchvision.transforms as transforms
from typing import List
from zeno import load_data, load_model, metric, slicer, transform

transform_image = transforms.Compose(
    [transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]
)


class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 6, 5)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = torch.flatten(x, 1)  # flatten all dimensions except batch
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x


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


# Return a prediction function that returns output given input
@load_model
def load_model(model_path):
    net = Net()
    net.load_state_dict(torch.load(model_path))

    def pred(instances):
        imgs = torch.stack([transform_image(img) for img in instances])
        with torch.no_grad():
            out = net(imgs)
        return [classes[i] for i in torch.argmax(out, dim=1).detach().numpy()]

    return pred


# Given metadata table, ID column, and data path,
# return list of data instances for metadata table
@load_data
def load_data(df_metadata, id_col, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata[id_col]]


# Return slice of data with associated metrics to calculate
@slicer(["accuracy", ("rotate", "accuracy"), ("flip", "accuracy")])
def small_sample(_, df):
    return df.sample(10)


@slicer(["accuracy"])
def overall(_, df):
    return df


@slicer(["accuracy"])
def medium_sample(data: List, metadata):
    return df.sample(100)


@slicer(["accuracy"])
def by_class(_, df):
    return [(c, df[df["label"] == c]) for c in classes]


@transform
def rotate(data, df_metadata):
    # return data, df_metadata
    return [img.rotate(90, PIL.Image.NEAREST, expand=1) for img in data], df_metadata


@metric
def accuracy(metadata, output):
    return df[df["label"] == out].shape[0] / (df.shape[0] + 0.0000001) * 100


@metric
def switch(metadata, output, m_data, m_df_metadata, m_output):
    return sum([1 for i in range(len(output)) if output[i] != m_output[i]])
