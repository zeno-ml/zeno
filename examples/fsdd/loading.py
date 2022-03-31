from zeno import load_model, load_data, metric
import os
import torch
import torchaudio


# @load_model
# def load_model(model_path):
#     def pred(instances):
#         return [1] * len(instances)

#     return pred

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


@load_model
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

    def pred(instances):
        input = prepare_model_input(read_batch(instances), device=device)
        output = model(input)
        return [decoder(x.cpu()) for x in output]

    return pred


@load_data
def load_data(df_metadata, data_path):
    return [os.path.join(data_path, f) for f in df_metadata.index]


@metric
def accuracy(output, df, label_col):
    df["text_label"] = df[label_col].apply(lambda x: number_to_text[x])
    return df["text_label"] == output
