import os
import json
import pandas as pd


def domino(cache_path, pd_with_preds_embed: pd.DataFrame, num_slices: int = 10):
    # construct the meerkat datapanel with true_labels, pred_labels, image_path,
    # embeddings (we have for free)
    #
    # run through image clip encodings
    # run the domino slice discovery
    # run the descriptors
    # package in nice json format

    # for now i just fudge the whole system and use this file
    # I generated in a separate notebook
    data = {}
    with open(os.path.join(cache_path, "domino_slices.json"), "r") as file:
        data = json.load(file)

    slices = [] if "slices" not in data else data["slices"]
    return slices
