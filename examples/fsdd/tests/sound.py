from zeno import preprocess
import numpy as np
import librosa


@preprocess
def amplitude(audios, _):
    amps = []
    for audio in audios:
        y, _ = librosa.load(audio)
        amps.append(np.abs(y).mean())
    return amps


@preprocess
def length(audios, _):
    amps = []
    for audio in audios:
        y, _ = librosa.load(audio)
        amps.append(len(y))
    return amps
