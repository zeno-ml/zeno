import math
import os

import pandas as pd
import torch
import whisper
from jiwer import wer

from zeno import ZenoOptions, distill, metric, model


@model
def load_model(model_path):
    if "sst" in model_path:
        device = torch.device("cpu")
        model, decoder, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-models",
            model="silero_stt",
            language="en",
            device=device,
        )
        (read_batch, _, _, prepare_model_input) = utils

        def pred(df, ops: ZenoOptions):
            files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
            input = prepare_model_input(read_batch(files), device=device)
            return [decoder(x.cpu()) for x in model(input)]

        return pred

    elif "whisper" in model_path:
        model = whisper.load_model("tiny")

        def pred(df, ops: ZenoOptions):
            files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
            outs = []
            for f in files:
                outs.append(model.transcribe(f)["text"])
            return outs

        return pred


@distill
def country(df, ops: ZenoOptions):
    if df["birthplace"][0] == df["birthplace"][0]:
        return df["birthplace"].str.split(", ")[-1][-1]
    return ""


@distill
def wer_m(df, ops: ZenoOptions):
    return df.apply(lambda x: wer(x[ops.label_column], x[ops.output_column]), axis=1)


@metric
def avg_wer(df, ops: ZenoOptions):
    avg = df[ops.distill_columns["wer_m"]].mean()
    if pd.isnull(avg) or math.isnan(avg):
        return 0
    return avg
