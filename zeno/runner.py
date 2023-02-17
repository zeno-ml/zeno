"""Entry to Zeno. Parses TOML file, starts server, and runs the pipeline."""

import os
import shutil
import sys
from pathlib import Path
from typing import Union

import pandas as pd
import pkg_resources
import requests
import tomli
import uvicorn
from multiprocess import Process  # type: ignore

from zeno.api import ZenoParameters
from zeno.backend import ZenoBackend
from zeno.server import get_server
from zeno.setup import setup_zeno
from zeno.util import is_notebook, parse_testing_file, VIEW_MAP_URL, VIEWS_MAP_JSON

# Global variable to hold the Zeno server process.
# This is used to kill the server when re-running in a notebook.
ZENO_SERVER_PROCESS = None


def command_line():
    if len(sys.argv) == 1 or sys.argv[1] == "-h" or sys.argv[1] == "--help":
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
            "ERROR: Zeno take one argument, either a configuration TOML file"
            + " or the keyword 'init'. "
            + "{0} arguments were passed.",
            len(sys.argv),
        )
        sys.exit(1)

    if sys.argv[1] == "-v" or sys.argv[1] == "--version":
        print(pkg_resources.get_distribution("zenoml").version)
        sys.exit(0)

    if sys.argv[1] == "init" or sys.argv[1] == "i":
        setup_zeno()
    else:
        parse_toml()


def parse_toml():
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

        # Read metadata as Pandas for slicing
        if meta_path.suffix == ".csv":
            args["metadata"] = pd.read_csv(meta_path)
        elif meta_path.suffix == ".parquet":
            args["metadata"] = pd.read_parquet(meta_path)
        else:
            print("Extension of " + meta_path.suffix + " not one of .csv or .parquet")
            sys.exit(1)

    if "functions" in args:
        fn_path = Path(os.path.realpath(os.path.join(base_path, args["functions"])))
        if os.path.isfile(fn_path):
            args["functions"] = parse_testing_file(fn_path)
        elif os.path.exists(fn_path):
            # Add directory with tests to path for relative imports.
            fns = []
            for f in list(fn_path.rglob("*.py")):
                fns = fns + parse_testing_file(f)
            args["functions"] = fns

    zeno(ZenoParameters(**args), base_path)


def parse_args(args: ZenoParameters, base_path) -> ZenoParameters:

    if type(args) == dict:
        args = ZenoParameters.parse_obj(args)

    if args.cache_path == "":
        args.cache_path = os.path.realpath(os.path.join(base_path, "./.zeno_cache/"))
    else:
        args.cache_path = os.path.realpath(os.path.join(base_path, args.cache_path))

    os.makedirs(args.cache_path, exist_ok=True)

    # Try to get view from GitHub List, if not try to read from path and copy it.
    if args.view != "":
        view_dest_path = Path(os.path.join(args.cache_path, "view.mjs"))
        view_path = Path(os.path.realpath(os.path.join(base_path, args.view)))
        if view_path.is_file():
            if view_dest_path.is_file():
                os.remove(view_dest_path)
            shutil.copyfile(view_path, view_dest_path)
        else:
            try:
                views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
                views = views_res.json()
                url = VIEW_MAP_URL + views[args.view]
                with open(view_dest_path, "wb") as out_file:
                    content = requests.get(url, stream=True).content
                    out_file.write(content)
            except KeyError:
                print(
                    "ERROR: View not found in list or relative path."
                    " See available views at ",
                    "https://github.com/zeno-ml/instance-views/blob/main/views.json",
                )
                sys.exit(1)

    if len(args.models) > 0:
        if Path(os.path.realpath(os.path.join(base_path, args.models[0]))).exists():
            args.models = [
                os.path.realpath(os.path.join(base_path, m)) for m in args.models
            ]

    if not args.data_path.startswith("http") and args.data_path != "":
        args.data_path = os.path.realpath(os.path.join(base_path, args.data_path))

    if args.label_path != "":
        args.label_path = os.path.realpath(os.path.join(base_path, args.label_path))

    if args.data_column != "" and args.id_column == "":
        args.id_column = args.data_column

    return args


def run_zeno(args: ZenoParameters):
    zeno = ZenoBackend(args)
    app = get_server(zeno)
    zeno.start_processing()

    print("\n\033[1mZeno\033[0m running on http://{}:{}\n".format(args.host, args.port))
    uvicorn.run(app, host=args.host, port=args.port, log_level="error")


def zeno(args: Union[ZenoParameters, dict], base_path="./"):
    if isinstance(args, dict):
        args = ZenoParameters.parse_obj(args)
    args = parse_args(args, base_path)

    if args.serve:
        global ZENO_SERVER_PROCESS
        if ZENO_SERVER_PROCESS is not None:
            ZENO_SERVER_PROCESS.terminate()

        ZENO_SERVER_PROCESS = Process(target=run_zeno, args=(args,))
        ZENO_SERVER_PROCESS.start()

        if not is_notebook():
            ZENO_SERVER_PROCESS.join()

    else:
        zeno = ZenoBackend(args)
        return zeno
