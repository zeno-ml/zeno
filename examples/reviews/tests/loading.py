from sklearn.metrics import f1_score, recall_score
from zeno import ZenoOptions, predict_function, distill_function, metric_function
from transformers import pipeline


@predict_function
def load_model(model_name):
    mod = pipeline("sentiment-analysis", model=model_name)

    def pred(df, ops: ZenoOptions):
        out = mod(list(df[ops.data_column]))
        clean_out = list(map(lambda x: 1 if x["label"] == "POSITIVE" else 0, out))
        return clean_out

    return pred


@distill_function
def length(df, ops: ZenoOptions):
    return [len(i) for i in df[ops.data_column]]


@distill_function
def unique_words(df, ops: ZenoOptions):
    return [len(set(i.split(" "))) for i in df[ops.data_column]]


@metric_function
def accuracy(df, ops: ZenoOptions):
    if len(df) == 0:
        return 0
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)
