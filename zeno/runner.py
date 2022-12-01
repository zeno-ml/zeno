import os
import shutil
import sys
from pathlib import Path

import nest_asyncio  # type: ignore
import pandas as pd
import pkg_resources
import requests  # type: ignore
import tomli
import uvicorn

from zeno.server import get_server
from zeno.util import parse_testing_file  # type: ignore
from zeno.zeno_backend import ZenoBackend

VIEW_MAP_URL = "https://raw.githubusercontent.com/zeno-ml/instance-views/main/"
VIEWS_MAP_JSON = "views.json"


def command_line():
    if len(sys.argv) == 1:
        print(
            "\n \033[1mZeno\033[0m",
            pkg_resources.get_distribution("zenoml").version,
            " - Machine learning evaluation framework.",
            "\n\n",
            "\033[1mUSAGE \033[0m \n\t",
            "zeno [-h] [-v] <config.toml>",
            "\n\n",
            "\033[1mARGUMENTS \033[0m \n\t",
            "<config.toml>\t\tZeno configuration file.\n\n"
            "\033[1m GLOBAL OPTIONS \033[0m \n\t",
            "-h (--help)\t\tDisplay this help message.\n"
            "\t -v (--version)\t\tDisplay this application version.\n",
        )

        sys.exit(0)

    if len(sys.argv) != 2:
        print(
            "ERROR: Zeno take one argument, a configuration TOML file. "
            + "{0} arguments were passed.",
            len(sys.argv),
        )
        sys.exit(1)

    if sys.argv[1] == "-v" or sys.argv[1] == "--version":
        print(pkg_resources.get_distribution("zenoml").version)
        sys.exit(0)

    args = {}
    try:
        with open(sys.argv[1], "rb") as f:
            args = tomli.load(f)
    except Exception:
        print("ERROR: Failed to read TOML configuration file.")
        sys.exit(1)

    base_path = os.path.dirname(os.path.abspath(sys.argv[1]))

    if "metadata" not in args:
        print("ERROR: Must have 'metadata' entry which must be a CSV or Parquet file.")
        sys.exit(1)
    else:
        meta_path = Path(os.path.realpath(os.path.join(base_path, args["metadata"])))
        # take out metadata_path, tests. should be dataframe and list of functions.
        # Read metadata as Pandas for slicing
        if meta_path.suffix == ".csv":
            args["metadata"] = pd.read_csv(meta_path)
        elif meta_path.suffix == ".parquet":
            args["metadata"] = pd.read_parquet(meta_path)
        else:
            print("Extension of " + meta_path.suffix + " not one of .csv or .parquet")
            sys.exit(1)

    if "functions" not in args or not os.path.exists(
        os.path.realpath(os.path.join(base_path, args["functions"]))
    ):
        print("WARNING: No 'functions' directory found.")
        args["functions"] = []
    else:
        args["functions"] = Path(
            os.path.realpath(os.path.join(base_path, args["functions"]))
        )
        # Add directory with tests to path for relative imports.
        fns = []
        for f in list(args["functions"].rglob("*.py")):
            fns = fns + parse_testing_file(f)
        args["functions"] = fns

    zeno(args, base_path)


def parse_args(args: dict, base_path) -> dict:
    if "view" not in args:
        print("ERROR: Must have 'view' entry")
        sys.exit(1)

    if "cache_path" not in args:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(base_path, "./.zeno_cache/"))
        )
    else:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(base_path, args["cache_path"]))
        )
    os.makedirs(args["cache_path"], exist_ok=True)

    # Try to get view from GitHub List, if not try to read from path and copy it.
    views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
    views = views_res.json()
    view_dest_path = Path(os.path.join(args["cache_path"], "view.mjs"))
    try:
        url = VIEW_MAP_URL + views[args["view"]]
        with open(view_dest_path, "wb") as out_file:
            content = requests.get(url, stream=True).content
            out_file.write(content)
    except KeyError:
        view_path = Path(os.path.realpath(os.path.join(base_path, args["view"])))
        if view_path.is_file():
            if view_dest_path.is_file():
                os.remove(view_dest_path)
            shutil.copyfile(view_path, view_dest_path)
        else:
            print(
                "ERROR: View not found in list or relative path. See available views",
                "at https://github.com/zeno-ml/instance-views/blob/main/views.json",
            )
            sys.exit(1)

    if "models" not in args or len(args["models"]) < 1:
        print("WARNING: No 'models' found.")
        args["models"] = []
    else:
        if Path(os.path.realpath(os.path.join(base_path, args["models"][0]))).exists():
            args["models"] = [
                Path(os.path.realpath(os.path.join(base_path, m)))
                for m in args["models"]
            ]

    if "data_path" not in args:
        args["data_path"] = ""
    elif not args["data_path"].startswith("http"):
        args["data_path"] = Path(
            os.path.realpath(os.path.join(base_path, args["data_path"]))
        )

    if "label_path" not in args:
        args["label_path"] = ""
    else:
        args["label_path"] = Path(
            os.path.realpath(os.path.join(base_path, args["label_path"]))
        )

    if "id_column" not in args:
        if "data_column" in args:
            args["id_column"] = args["data_column"]
        else:
            print(
                "ERROR: Must have 'id_column' referencing a column with unique IDs",
                "if no data_column is specified.",
            )

    if "data_column" not in args:
        args["data_column"] = ""

    if "label_column" not in args:
        args["label_column"] = "label"

    if "samples" not in args:
        args["samples"] = 30

    if "editable" not in args:
        args["editable"] = True
    else:
        args["editable"] = args["editable"]

    if "port" not in args:
        args["port"] = 8000

    if "host" not in args:
        args["host"] = "localhost"

    if "batch_size" not in args:
        args["batch_size"] = 1

    if "serve" not in args:
        args["serve"] = True

    return args


def zeno(args, base_path="./"):
    nest_asyncio.apply()
    args = parse_args(args, base_path)
    zeno = ZenoBackend(
        df=args["metadata"],
        functions=args["functions"],
        models=args["models"],
        batch_size=args["batch_size"],
        id_column=args["id_column"],
        data_column=args["data_column"],
        label_column=args["label_column"],
        data_path=args["data_path"],
        label_path=args["label_path"],
        cache_path=args["cache_path"],
        editable=args["editable"],
        samples=args["samples"],
        view=args["view"],
    )

    zeno.start_processing()
    app = get_server(zeno)

    if args["serve"]:
        uvicorn.run(app, host=args["host"], port=args["port"])
    else:
        return app
