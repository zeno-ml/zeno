import asyncio
import importlib
import json
import os
import sys
from pathlib import Path
from typing import List

import tomli
import uvicorn  # type: ignore
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from .classes import (
    MetricKey,
    PipelineIdFilter,
    PipelineInit,
    PipelineProjection,
    PipelineRegionLabeler,
    PipelineReset,
    Report,
    Slice,
    StatusResponse,
    ZenoColumn,
    ZenoSettings,
    ZenoVariables,
)
from .zeno import Zeno


def main():
    if len(sys.argv) != 2:
        print(
            "ERROR: Zeno take one argument, a configuration TOML file."
            + "{0} arguments were passed.",
            len(sys.argv),
        )
        sys.exit(1)

    args = {}
    try:
        with open(sys.argv[1], "rb") as f:
            args = tomli.load(f)
    except Exception:
        print("ERROR: Failed to read TOML configuration file.")
        sys.exit(1)

    toml_path = os.path.dirname(os.path.abspath(sys.argv[1]))

    if "view" not in args:
        print(
            "ERROR: Must have 'view' entry which is a valid and installed"
            + "Python Zeno view package:"
        )
        sys.exit(1)

    try:
        args["view"] = args["view"].replace("-", "_")
        mod = importlib.import_module(args["view"])
    except ModuleNotFoundError:
        print("ERROR: " + args["view"] + " is not a valid python package")
        sys.exit(1)

    if not mod.path:
        print("ERROR: View does not export a valid path variable.")
        sys.exit(1)

    args["view"] = mod.path

    if "metadata" not in args:
        print("ERROR: Must have 'metadata' entry which must be a CSV or Parquet file.")
        sys.exit(1)
    else:
        args["metadata"] = Path(
            os.path.realpath(os.path.join(toml_path, args["metadata"]))
        )

    if "tests" not in args or not os.path.exists(args["tests"]):
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

    if "port" not in args:
        args["port"] = 8000

    if "batch_size" not in args:
        args["batch_size"] = 1

    if "cache_path" not in args:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(toml_path, "./.zeno_cache/"))
        )
    else:
        args["cache_path"] = Path(
            os.path.realpath(os.path.join(toml_path, args["cache_path"]))
        )

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
    app.mount(
        "/view",
        StaticFiles(directory=args["view"]),
        name="view",
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

    @api_app.post("/pipe/reset")
    def reset_pipeline(req: PipelineReset):
        zeno.reset_pipeline(req.up_to_id)
        return json.dumps({"status": True})

    @api_app.post("/pipe/load")
    def load_pipeline(req: PipelineInit):
        js_export = zeno.load_pipeline(req.model, req.uid)
        return json.dumps({"status": True, "data": js_export})

    @api_app.post("/pipe/init")
    def init_pipeline(req: PipelineInit):
        zeno.init_pipeline(req.model, req.uid)
        return json.dumps({"status": True})

    @api_app.post("/pipe/id-filter")
    def filter_pipeline(req: PipelineIdFilter):
        js_export = zeno.add_id_filter_pipeline(req.ids)
        return json.dumps({"status": True, "data": js_export})

    @api_app.post("/pipe/umap")
    def umap_pipeline(req: PipelineProjection):
        js_export = zeno.add_umap_pipeline(req.args)
        return json.dumps({"status": True, "data": js_export})

    @api_app.post("/pipe/region-labeler")
    def region_labeler_pipeline(req: PipelineRegionLabeler):
        js_export = zeno.add_region_labeler_pipeline(
            req.polygon, req.name, req.up_to_id
        )
        return json.dumps({"status": True, "data": js_export})

    @api_app.get("/pipe/graph")
    def get_pipeline_json():
        js_export = zeno.get_json_pipeline()
        return json.dumps({"status": True, "data": js_export})

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

    uvicorn.run(app, host="localhost", port=args["port"])  # type: ignore
