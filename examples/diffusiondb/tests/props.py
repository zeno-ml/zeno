from zeno import distill, ZenoOptions
from pandas import DataFrame


@distill
def length(df: DataFrame, ops: ZenoOptions):
    return df["0prompt"].str.len()
