import numpy as np
import pandas as pd
from functools import lru_cache


DEVICE = "cpu"


def ndarray_from_df(df: pd.DataFrame, column_name: str):
    if column_name in df.columns:
        return df[column_name].to_numpy()
    else:
        return np.ndarray([])


@lru_cache()
def clip_model(variant: str = "ViT-B/32", device=DEVICE):
    try:
        import clip
    except ModuleNotFoundError:
        raise ("YOU! do => 'pip install git+https://github.com/openai/CLIP.git'")

    model, _ = clip.load(variant, device)

    return clip.tokenize, model


def encode_text(text: str, device="cpu"):
    tokenize, model = clip_model(device=device)
    tokens = tokenize(text).to(device)
    text_encoding = model.encode_text(tokens)
    return text_encoding.T


def distill_text(images: np.ndarray, text: str):
    """Connects the text to the images and gives a score
    per each image showing the "fit"

    Args:
                images (np.ndarray): this is a data_length x embedding_size ndarray
                text (str):
    """

    try:
        import torch
    except ModuleNotFoundError:
        raise ("YOU! do => 'pip install torch'")

    image_encodings = torch.tensor(images).to(device=DEVICE)

    text_encoding = encode_text(text, device=DEVICE)

    # how well each image makes sense with the text
    clip_scores: torch.Tensor = image_encodings @ text_encoding
    clip_scores_normalized = clip_scores / clip_scores.max()
    clip_scores_ndarray = clip_scores_normalized.detach().cpu().numpy()

    return clip_scores_ndarray
