import os

import torch
import whisper
from zeno import ZenoOptions, model


@model
def load_model(model_path):
    if "sst" in model_path:
        device = torch.device("cpu")
        model, decoder, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-models",
            model="silero_stt",
            language="en",  # also available 'de', 'es'
            device=device,
        )
        (read_batch, _, _, prepare_model_input) = utils

        def pred(df, ops: ZenoOptions):
            files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
            input = prepare_model_input(read_batch(files), device=device)
            output = model(input)
            return [decoder(x.cpu()) for x in output]

        return pred

    elif "whisper" in model_path:
        model = whisper.load_model("base")

        def pred(df, ops: ZenoOptions):
            files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
            outs = []
            for f in files:
                outs.append(model.transcribe(f)["text"])
            return outs

        return pred
