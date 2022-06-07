from zeno import metric, ZenoOptions
from sklearn.metrics import f1_score, recall_score


@metric
def accuracy(df, ops: ZenoOptions):
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)


@metric
def recall(df, ops: ZenoOptions):
    return 100 * recall_score(
        df[ops.label_column], df[ops.output_column], average="macro"
    )


@metric
def f1(df, ops: ZenoOptions):
    return 100 * f1_score(df[ops.label_column], df[ops.output_column], average="macro")
