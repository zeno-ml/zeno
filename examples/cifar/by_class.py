from zeno import slicer, transform, preprocess


@slicer(["accuracy", ("blur", "accuracy")])
def overall(metadata):
    return metadata.index


@slicer(["accuracy", ("blur", "accuracy")])
def cat(metadata):
    return metadata[metadata["label"] == "cat"].index


@slicer(["accuracy", ("blur", "accuracy")])
def frog(metadata):
    return metadata[metadata["label"] == "frog"].index


@slicer(["accuracy", ("blur", "accuracy")])
def dog(metadata):
    return metadata[metadata["label"] == "dog"].index


# @slicer(["accuracy"])
# def by_class(metadata, label_col):
#     return [(c, metadata[metadata[label_col] == c].index) for c in classes]
