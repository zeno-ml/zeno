import os

import librosa
import numpy as np
from zeno import ZenoOptions, preprocess


@preprocess
def amplitude(df, ops: ZenoOptions):
    files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
    amps = []
    for audio in files:
        y, _ = librosa.load(audio)
        amps.append(np.abs(y).mean())
    return amps


@preprocess
def length(df, ops: ZenoOptions):
    files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
    amps = []
    for audio in files:
        y, _ = librosa.load(audio)
        amps.append(len(y))
    return amps
