from mltest import mlslicer, mltest, mlmodel

from transformers import pipeline
sentiment_rob_large = pipeline(
    "sentiment-analysis", model="siebert/sentiment-roberta-large-english")
sentiment_rob_small = pipeline(
    "sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment")


@mlmodel
def rob_large(ent):
    return 1 if sentiment_rob_large(ent)[0]["label"] == "POSITIVE" else 0


@mlmodel
def rob_small(ent):
    return 1 if sentiment_rob_small(ent)[0]["label"] == "POSITIVE" else 0


@mlslicer(['accuracy'])
def short(df):
    return df[df['content'].str.len() < 100]


@mlslicer(['accuracy'])
def medium(df):
    return df[(df['content'].str.len() > 100) & (df['content'].str.len() < 300)]


@mlslicer(['accuracy'])
def total(df):
    return df


@mlslicer(['bad_to_good_switch', 'add_not'])
def bad(df):
    return df[df['content'].str.contains("bad")]


@mltest
def bad_to_good_switch(df, model):
    new_text = df['content'].str.replace("bad", "good")
    preds = [model(x) for x in new_text.to_list()]
    corr = 0
    for ent in zip(preds, df['out'].to_list()):
        if ent[0] != ent[1]:
            corr += 1
    return corr / len(preds) * 100


@mltest
def add_not(df, model):
    new_text = df['content'].str.replace("bad", "not bad")
    preds = [model(x) for x in new_text.to_list()]
    corr = 0
    for ent in zip(preds, df['out'].to_list()):
        if ent[0] != ent[1]:
            corr += 1
    return corr / len(preds) * 100


@mltest
def accuracy(df, model):
    return df[df['label'] == df['out']].shape[0] / df.shape[0] * 100
