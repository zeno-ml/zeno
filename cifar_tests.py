from mltest import slicer, tester, load_model, predictor
from cifar import Net
import torch

# sentiment_rob_large = pipeline(
#     "sentiment-analysis", model="siebert/sentiment-roberta-large-english")
# sentiment_rob_small = pipeline(
#     "sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")


@load_model
def load_model(model_path):
    net = Net()
    net.load_state_dict(torch.load(model_path))
    return net


@predictor
def predict(model, instances):


@slicer(['accuracy'])
def short(df):
    return df[df['content'].str.len() < 100]


@slicer(['accuracy'])
def small_set(df):
    return df.sample(100)


@tester
def accuracy(df, model, id_col):
    df['out'] = model(df[id_col])
    return df[df['label'] == df['out']].shape[0] / df.shape[0] * 100
