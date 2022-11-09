import clip
import numpy as np
import pandas as pd
import torch


DEVICE = "cpu"
MODEL = None


def ndarray_from_df(df: pd.DataFrame, column_name: str):
    if column_name in df.columns:
        return df[column_name].to_numpy()
    else:
        return np.ndarray([])


def encode_text(text: str, device="cpu"):
    global MODEL
    if MODEL is None:
        model, _ = clip.load("ViT-B/32", device)
        MODEL = model

    tokens = clip.tokenize(text).to(device)

    text_encoding = MODEL.encode_text(tokens)
    return text_encoding.T


def distill_text(images: np.ndarray, text: str):
    """Connects the text to the images and gives a score
    per each image showing the "fit"

    Args:
        images (np.ndarray): this is a data_length x embedding_size ndarray
        text (str):
    """

    image_encodings = torch.tensor(images).to(device=DEVICE)
    text_encoding = encode_text(text, device=DEVICE)

    # how well each image makes sense with the text
    clip_scores: torch.Tensor = image_encodings @ text_encoding
    clip_scores_ndarray = clip_scores.detach().cpu().numpy()

    return clip_scores_ndarray
