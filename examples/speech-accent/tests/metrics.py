import jiwer
from zeno import ZenoOptions, distill, metric


@distill
def wer(df, ops: ZenoOptions):
    return df.apply(
        lambda x: jiwer.wer(x[ops.label_column], x[ops.output_column]), axis=1
    )


@distill
def mer(df, ops: ZenoOptions):
    return df.apply(
        lambda x: jiwer.mer(x[ops.label_column], x[ops.output_column]), axis=1
    )


@metric
def avg_mer(df, ops: ZenoOptions):
    return df[ops.distill_columns["mer"]].mean()


@metric
def avg_wer(df, ops: ZenoOptions):
    return df[ops.distill_columns["wer"]].mean()
