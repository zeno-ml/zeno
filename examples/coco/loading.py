from zeno import load_model, load_data, metric
from PIL import Image
import os


@load_model
def load_model(model_path):
    def pred(instances):
        return [1] * len(instances)

    return pred


@load_data
def load_data(df_metadata, data_path):
    print(df_metadata.index, data_path)
    return [Image.open(os.path.join(data_path, img)) for img in df_metadata.index]


@metric
def accuracy(output, metadata, label_col):
    return [1] * len(output)
