"""The `zeno init` command, which sets up a new Zeno project."""

import os

import requests
from InquirerPy.resolver import prompt
from InquirerPy.validator import PathValidator

from zeno.util import VIEW_MAP_URL, VIEWS_MAP_JSON

TOML_TEMPLATE = """functions = "./"
view = "{}"
metadata = "{}"
data_path = "{}"
data_column = "{}"
{}
models = [] # Add paths to model checkpoints, passed into @model
"""


def setup_zeno():
    print(
        "Welcome to \033[1mZeno\033[0m! The following questions will guide "
        + "you through setting up your project.\n"
    )

    views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
    views = list(views_res.json().keys())

    questions = [
        {
            "type": "input",
            "message": "Name your project/folder:",
            "name": "name",
            "validate": lambda r: len(r) > 0,
            "invalid_message": "Input cannot be empty.",
        },
        {
            "type": "list",
            "message": "What type of model are you evaluating?",
            "name": "view",
            "choices": views,
        },
        {
            "type": "filepath",
            "message": "Path to a metadata file (CSV or Parquet):",
            "name": "metadata",
            "validate": PathValidator(is_file=True, message="Input is not a file"),
            "only_files": True,
        },
        {
            "type": "filepath",
            "message": "Folder or URL with data (e.g. image folder or S3 endpoint):",
            "name": "data_path",
        },
        {
            "type": "input",
            "message": "Name of the column in the metadata file"
            + " with relative file paths:",
            "name": "data_column",
        },
        {
            "type": "input",
            "message": "Name of the column in the metadata file"
            + " with ground truth labels (OPTIONAL):",
            "name": "label_column",
        },
        {
            "type": "list",
            "message": "Which library are you using?",
            "name": "model_type",
            "choices": ["None", "PyTorch", "TensorFlow", "Keras", "HuggingFace"],
        },
        {"type": "confirm", "message": "Confirm?", "name": "confirm"},
    ]

    result = prompt(questions)
    print(
        "\nCongrats! A new folder, {}, has been created with a ".format(result["name"])
        + "zeno.toml file inside. Run Zeno with the following:"
    )
    print(("\n\t cd {} \n\t zeno zeno.toml").format(result["name"]))

    print("\n To set up your model, follow the instructions in model.py")

    # Create new directory with zeno.toml file
    os.mkdir(str(result["name"]))

    # Update paths to be relative to new directory if relative to start with.
    if os.path.exists(str(result["data_path"])) and not os.path.isabs(str("data_path")):
        result["data_path"] = os.path.relpath(
            str(result["data_path"]), "./" + str(result["name"])
        )
    if not os.path.isabs(str("metadata")):
        result["metadata"] = os.path.relpath(
            str(result["metadata"]), "./" + str(result["name"])
        )

    os.chdir(str(result["name"]))

    with open("zeno.toml", "w") as f:
        f.write(
            TOML_TEMPLATE.format(
                result["view"],
                result["metadata"],
                result["data_path"],
                result["data_column"],
                'label_column = "' + str(result["label_column"]) + '"'
                if result["label_column"]
                else "",
            )
        )
    # Create model.py file
