from zeno_decorators import slicer, tester, load_model, predictor
from cifar.model import Net
import torchvision.transforms as transforms
import torch
import PIL

transform = transforms.Compose(
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


@load_model
def load_model(model_path):
    net = Net()
    net.load_state_dict(torch.load(model_path))
    return net


@predictor
def predict(model, instances):
    imgs = torch.stack([transform(PIL.Image.open(i)) for i in instances])
    with torch.no_grad():
        out = model(imgs)
    return [classes[i] for i in torch.argmax(out, dim=1).detach().numpy()]


@slicer(["accuracy"])
def overall(df):
    return df


@slicer(["accuracy"])
def by_class(df):
    return [(c, df[df["label"] == c]) for c in classes]


@tester
def accuracy(df, model, id_col):
    out = model(df)
    return df[df["label"] == out].shape[0] / (df.shape[0] + 0.0000001) * 100
