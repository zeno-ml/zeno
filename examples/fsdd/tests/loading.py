import os

import pandas as pd
import torch
from zeno import ZenoOptions, metric, model

number_to_text = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
}


@model
def load_model(model_path):
    device = torch.device(
        "cpu"
    )  # gpu also works, but our models are fast enough for CPU
    model, decoder, utils = torch.hub.load(
        repo_or_dir="snakers4/silero-models",
        model="silero_stt",
        language="en",  # also available 'de', 'es'
        device=device,
    )
    (
        read_batch,
        split_into_batches,
        read_audio,
        prepare_model_input,
    ) = utils  # see function signature for details

    def pred(df, ops: ZenoOptions):
        files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
        input = prepare_model_input(read_batch(files), device=device)
        output = model(input)
        return [decoder(x.cpu()) for x in output]

    return pred


@metric
def accuracy(df, ops: ZenoOptions):
    text_label = df[ops.label_column].apply(lambda x: number_to_text[x])
    return 100 * (pd.Series(text_label) == df[ops.output_column]).sum() / len(df)
