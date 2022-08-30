from zeno import transform, ZenoOptions
import os
import librosa
import soundfile as sf


@transform
def lower_amplitude(df, ops: ZenoOptions):
    files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
    amps = []
    for audio in files:
        y, sr = librosa.load(audio)
        y = y / 10
        amps.append(audio.split("/")[-1])
        sf.write(os.path.join(ops.output_path, audio.split("/")[-1]), y, sr)
    return amps
