from zeno import slicer


@slicer
def short(df):
    return df[df["length"] < 100]


@slicer
def long(df):
    return df[df["length"] > 500]


@slicer
def overall(df):
    return df
