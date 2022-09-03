from sklearn.metrics import f1_score, recall_score
import zeno
from zeno import ZenoOptions


@zeno.metric
def accuracy(df, ops: ZenoOptions):
    if len(df) == 0:
        return 0
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)


@zeno.metric
def recall(df, ops: ZenoOptions):
    return 100 * recall_score(
        df[ops.label_column], df[ops.output_column], average="macro"
    )


@zeno.metric
def f1(df, ops: ZenoOptions):
    return 100 * f1_score(df[ops.label_column], df[ops.output_column], average="macro")


@zeno.distill
def incorrect(df, ops: ZenoOptions):
    return (df[ops.label_column] != df[ops.output_column]).tolist()


@zeno.distill
def output_label(df, ops: ZenoOptions):
    return df[ops.output_column]
