from zeno_decorators import slicer, tester, load_model, predictor
from transformers import pipeline

# sentiment_rob_large = pipeline(
#     "sentiment-analysis", model="siebert/sentiment-roberta-large-english")
# sentiment_rob_small = pipeline(
#     "sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")


@load_model
def load_model(model_name):
    return pipeline("sentiment-analysis", model=model_name)


@predictor
def predict(model, ent):
    return [1 if out["label"] == "POSITIVE" else 0 for out in model(ent)]


@slicer(['accuracy'])
def short(df):
    return df[df['content'].str.len() < 100]


@slicer(['accuracy'])
def medium(df):
    return df[(df['content'].str.len() > 100) & (df['content'].str.len() < 300)]


@slicer(['bad_to_good_switch', 'add_not'])
def bad(df):
    return df[df['content'].str.contains("bad")]


@slicer(['accuracy'])
def total(df):
    return df


@tester
def bad_to_good_switch(df, model, _):
    new_text = df['content'].str.replace("bad", "good")
    preds = model(new_text.to_list())
    corr = 0
    for ent in zip(preds, df['out'].to_list()):
        if ent[0] != ent[1]:
            corr += 1
    return corr / len(preds) * 100


@tester
def accuracy(df, model, _):
    return df[df['label'] == df['out']].shape[0] / df.shape[0] * 100


@tester
def add_not(df, model, _):
    new_text = df['content'].str.replace("bad", "not bad")
    preds = model(new_text.to_list())
    corr = 0
    for ent in zip(preds, df['out'].to_list()):
        if ent[0] != ent[1]:
            corr += 1
    return corr / len(preds) * 100
