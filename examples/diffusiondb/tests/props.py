from zeno import distill, ZenoOptions
from pandas import DataFrame


@distill
def length(df: DataFrame, ops: ZenoOptions):
    return df["prompt"].str.len()
