import torchvision.transforms as transforms
import PIL
import torch
import torch.nn as nn
import torch.nn.functional as F
import os
from zeno import load_data, load_model, metric

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
        y = F.relu(self.fc2(x))
        x = self.fc3(y)
        return x, y


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


@load_model
def load_model(model_path):
    net = Net()
    net.load_state_dict(torch.load(model_path))

    def pred(instances):
        imgs = torch.stack([transform_image(img) for img in instances])
        with torch.no_grad():
            out, emb = net(imgs)
        return [
            classes[i] for i in torch.argmax(out, dim=1).detach().numpy()
        ], emb.detach().numpy()

    return pred


@load_data
def load_data(df_metadata, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata.index]


@metric
def accuracy(output, metadata, label_col):
    return metadata[label_col] == output


@metric
def failure(output, metadata, label_col):
    return metadata[label_col] != output
