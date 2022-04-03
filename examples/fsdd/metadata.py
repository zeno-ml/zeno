from zeno import slicer


@slicer
def speaker(df, label_col):
    speakers = list(df["speaker"].unique())
    return [(c, df[df["speaker"] == c].index) for c in speakers]


@slicer
def number(df, label_col):
    lab = list(df[label_col].unique())
    return [(str(c), df[df[label_col] == c].index) for c in lab]


@slicer
def overall(df):
    return df
