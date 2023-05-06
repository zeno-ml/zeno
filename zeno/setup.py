"""The `zeno init` command, which sets up a new Zeno project."""

import os

import inquirer
import requests
from inquirer import Path, errors

from zeno.util import VIEW_MAP_URL, VIEWS_MAP_JSON

TOML_TEMPLATE = """functions = "./"
view = "{}"
metadata = "{}"
data_column = "{}"
{}
models = [] # Add paths to model checkpoints, passed into @model
"""


def validate_name(_, name):
    if len(name) == 0:
        raise errors.ValidationError("", reason="Project name cannot be empty.")
    return True


def setup_zeno():
    print(
        "Welcome to \033[1mZeno\033[0m! The following questions will guide "
        + "you through setting up your project.\n"
    )

    views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
    views = list(views_res.json().keys())

    questions = [
        inquirer.Text(
            "name",
            message="Name your project/folder",
            validate=validate_name,
        ),
        inquirer.List(
            "view", message="What type of model are you evaluating", choices=views
        ),
        inquirer.Path(
            "metadata",
            message="Path to a metadata file (CSV or Parquet)",
            path_type=Path.FILE,
            exists=True,
        ),
        inquirer.Text(
            "data_column",
            message="Name of the column with data instances or paths"
            + "in the metadata file",
        ),
        inquirer.Text(
            "label_column",
            message="Name of the column with labels in the metadata file",
        ),
    ]

    result = inquirer.prompt(questions)
    if result is None:
        return

    print(
        "\nCongrats! A new folder, {}, has been created with a ".format(result["name"])
        + "zeno.toml file inside. Run Zeno with the following:"
    )
    print(("\n\t cd {} \n\t zeno zeno.toml").format(result["name"]))

    print(
        "\n If your data is saved as files, e.g. images or video, please set the ",
        "data_path option in the config file. To set up your model, follow the ",
        "instructions in model.py",
    )

    # Create new directory with zeno.toml file
    os.mkdir(str(result["name"]))

    # Update paths to be relative to new directory if relative to start with.
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
                result["data_column"],
                'label_column = "' + str(result["label_column"]) + '"'
                if result["label_column"]
                else "",
            )
        )
    # Create model.py file
