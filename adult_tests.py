from mltest import mltest, mlslicer, mlmodel


@mlmodel
def default(ent):
    return ent['out']


@mlslicer(['accuracy', 'false_positive'])
def under_25(df):
    return df[df['age'] < 25]


@mlslicer(['accuracy'])
def education(df):
    filts = []
    for v in df['education'].unique():
        filts.append((v, df[df['education'] == v]))
    return filts


@mlslicer(['accuracy'])
def over_50(df):
    return df[df['age'] > 50]


@mltest
def accuracy(df, pred):
    return df[df['income'] == df['out']].shape[0] / df.shape[0] * 100


@mltest
def false_positive(df, pred):
    return df[(df['income'] == "<=50K") & (df['out'] == ">50K")].shape[0] / df.shape[0] * 100
