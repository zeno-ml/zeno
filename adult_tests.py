from zeno_decorators import tester, slicer, load_model, predictor


@load_model
def load_model(model_name):
    return ""


@predictor
def predict(model, ent):
    return ent['out']


@slicer(['accuracy', 'false_positive'])
def under_25(df):
    return df[df['age'] < 25]


@slicer(['accuracy'])
def education(df):
    filts = []
    for v in df['education'].unique():
        filts.append((v, df[df['education'] == v]))
    return filts


@slicer(['accuracy'])
def over_50(df):
    return df[df['age'] > 50]


@tester
def accuracy(df, pred, _):
    return df[df['income'] == df['out']].shape[0] / df.shape[0] * 100


@tester
def false_positive(df, pred, _):
    return df[(df['income'] == "<=50K") & (df['out'] == ">50K")].shape[0] / df.shape[0] * 100
