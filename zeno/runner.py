import asyncio
import json
import os
import sys
from pathlib import Path
from typing import List

import pkg_resources
import requests  # type: ignore
import tomli
import uvicorn  # type: ignore
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from zeno.classes import (
    MetricKey,
    MirrorProject,
    Report,
    Slice,
    StatusResponse,
    ZenoColumn,
    ZenoSettings,
    ZenoVariables,
)
from zeno.zeno import Zeno

VIEW_MAP_URL = "https://raw.githubusercontent.com/zeno-ml/instance-views/main/"
VIEWS_MAP_JSON = "views.json"


def main():

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

    toml_path = os.path.dirname(os.path.abspath(sys.argv[1]))

    if "view" not in args:
        print("ERROR: Must have 'view' entry")
        sys.exit(1)

    if "cache_path" not in args:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(toml_path, "./.zeno_cache/"))
        )
    else:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(toml_path, args["cache_path"]))
        )
    os.makedirs(args["cache_path"], exist_ok=True)

    views_res = requests.get(VIEW_MAP_URL + VIEWS_MAP_JSON)
    views = views_res.json()
    url = VIEW_MAP_URL + views[args["view"]]
    with open(os.path.join(args["cache_path"], "view.mjs"), "wb") as out_file:
        content = requests.get(url, stream=True).content
        out_file.write(content)

    if "metadata" not in args:
        print("ERROR: Must have 'metadata' entry which must be a CSV or Parquet file.")
        sys.exit(1)
    else:
        args["metadata"] = Path(
            os.path.realpath(os.path.join(toml_path, args["metadata"]))
        )

    if "tests" not in args or not os.path.exists(
        os.path.realpath(os.path.join(toml_path, args["tests"]))
    ):
        print("WARNING: No 'tests' directory found.")
        args["tests"] = None
    else:
        args["tests"] = Path(os.path.realpath(os.path.join(toml_path, args["tests"])))

    if "models" not in args or len(args["models"]) < 1:
        print("WARNING: No 'models' found.")
        args["models"] = []
    else:
        if Path(os.path.realpath(os.path.join(toml_path, args["models"][0]))).exists():
            args["models"] = [
                Path(os.path.realpath(os.path.join(toml_path, m)))
                for m in args["models"]
            ]

    if "data_path" not in args:
        args["data_path"] = ""
    else:
        args["data_path"] = Path(
            os.path.realpath(os.path.join(toml_path, args["data_path"]))
        )

    if "label_path" not in args:
        args["label_path"] = ""
    else:
        args["label_path"] = Path(
            os.path.realpath(os.path.join(toml_path, args["label_path"]))
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

    if "port" not in args:
        args["port"] = 8000

    if "host" not in args:
        args["host"] = "localhost"

    if "batch_size" not in args:
        args["batch_size"] = 1

    run_zeno(args)


def run_zeno(args):
    zeno = Zeno(
        metadata_path=args["metadata"],
        tests=args["tests"],
        models=args["models"],
        batch_size=args["batch_size"],
        id_column=args["id_column"],
        data_column=args["data_column"],
        label_column=args["label_column"],
        data_path=args["data_path"],
        label_path=args["label_path"],
        cache_path=args["cache_path"],
    )
    zeno.start_processing()

    app = FastAPI(title="Frontend API")
    api_app = FastAPI(title="Backend API")

    if args["data_path"] != "":
        app.mount("/data", StaticFiles(directory=args["data_path"]), name="static")
    if args["label_path"] != "":
        app.mount("/labels", StaticFiles(directory=args["label_path"]), name="static")

    app.mount(
        "/cache",
        StaticFiles(directory=args["cache_path"]),
        name="cache",
    )
    app.mount("/api", api_app)
    app.mount(
        "/",
        StaticFiles(
            directory=os.path.dirname(os.path.realpath(__file__)) + "/frontend",
            html=True,
        ),
        name="base",
    )

    @api_app.get("/settings", response_model=ZenoSettings)
    def get_settings():
        return ZenoSettings(
            view=args["view"],
            id_column=zeno.id_column,
            label_column=zeno.label_column,
            data_column=zeno.data_column,
            metadata_columns=zeno.columns,
            samples=args["samples"],
        )

    @api_app.get("/initialize", response_model=ZenoVariables)
    def get_initial_info():
        return ZenoVariables(
            metrics=list(zeno.metric_functions.keys()),
            transforms=list(zeno.transform_functions.keys()),
            models=[str(n) for n in zeno.model_names],
            folders=zeno.folders,
        )

    @api_app.get("/slices")
    def get_slices():
        return json.dumps(zeno.get_slices())

    @api_app.get("/reports")
    def get_reports():
        return json.dumps(zeno.get_reports())

    @api_app.post("/results")
    def get_results(reqs: List[MetricKey]):
        return json.dumps(zeno.get_results(reqs))

    @api_app.post("/table")
    def get_table(columns: List[ZenoColumn]):
        return Response(zeno.get_table(columns))

    @api_app.post("/set-folders")
    def set_folders(folders: List[str]):
        zeno.set_folders(folders)

    @api_app.post("/set-slices")
    def set_slices(slices: List[Slice]):
        zeno.set_slices(slices)

    @api_app.post("/set-reports")
    def update_reports(reqs: List[Report]):
        zeno.set_reports(reqs)

    @api_app.post("/mirror/project")
    def mirror_project(req: MirrorProject):
        # not specified or entire data frame just use the cache
        if req.ids is None or len(req.ids) == len(zeno.df):
            proj = zeno.mirror.initProject(req.model, req.transform)
        else:
            proj = zeno.mirror.filterProject(
                req.model, req.ids, req.transform, perplexity=req.perplexity
            )

        return json.dumps({"model": req.model, "data": proj})

    @api_app.get("/mirror/sdm")
    def sdm():
        return json.dumps({"data": zeno.mirror.generate_slices()})

    @api_app.get("/mirror/exists/{model}")
    def embedding_exists(model: str):
        exists = zeno.embedding_exists(model)
        return json.dumps({"model": model, "exists": exists})

    @api_app.websocket("/status")
    async def results_websocket(websocket: WebSocket):
        await websocket.accept()
        previous_status = ""
        while True:
            await asyncio.sleep(1)
            if zeno.status != previous_status:
                previous_status = zeno.status
                await websocket.send_json(
                    StatusResponse(
                        status=zeno.status,
                        done_processing=zeno.done_processing,
                        complete_columns=zeno.complete_columns,
                    ).json(by_alias=True)
                )

    uvicorn.run(app, host=args["host"], port=args["port"])  # type: ignore
