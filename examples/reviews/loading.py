from zeno import load_model, load_data, metric
from transformers import pipeline
from zeno.api import preprocess


@load_model
def load_model(model_name):
    mod = pipeline("sentiment-analysis", model=model_name)

    def pred(instances):
        out = mod(instances)
        clean_out = list(map(lambda x: 1 if x["label"] == "POSITIVE" else 0, out))
        return clean_out

    return pred


@load_data
def load_data(df, _):
    return df["content"].tolist()


@preprocess
def length(instances):
    return [len(i) for i in instances]


@metric
def accuracy(output, df, label_col):
    return df[label_col] == output


@metric
def false_positive(output, df, label_col):
    df["out"] = output
    return df[(df["out"] == 1) & (df[label_col] == 0)]


@metric
def false_negative(output, df, label_col):
    df["out"] = output
    return df[(df["out"] == 0) & (df[label_col] == 1)]
