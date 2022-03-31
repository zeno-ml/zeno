from zeno import slicer

classes = (
    "airplane",
    "automobile",
    "bird",
    "cat",
    "deer",
    "dog",
    "frog",
    "horse",
    "ship",
    "truck",
)


@slicer
def overall(metadata):
    return metadata.index


# @slicer
# def cat(metadata):
#     return metadata[metadata["label"] == "cat"].index


# @slicer
# def frog(metadata):
#     return metadata[metadata["label"] == "frog"].index


# @slicer
# def dog(metadata):
#     return metadata[metadata["label"] == "dog"].index


@slicer
def by_class(metadata, label_col):
    return [(c, metadata[metadata[label_col] == c].index) for c in classes]
