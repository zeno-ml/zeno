import json
import os

import pandas as pd


EXAMPLE_SLICES = False


def domino(cache_path, pd_with_preds_embed: pd.DataFrame, num_slices: int = 10):
    """
    Given a dataframe with predictions and embeddings,
    return a list of slices from automated slice algo
    """
    slices = []

    if EXAMPLE_SLICES:
        data = {}
        with open(os.path.join(cache_path, "domino_slices_14.json"), "r") as file:
            data = json.load(file)

        slices = [] if "slices" not in data else data["slices"]

    return slices
