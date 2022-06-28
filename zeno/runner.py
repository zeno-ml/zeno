import asyncio
import json
import os
import sys
from pathlib import Path
from urllib.parse import unquote

import tomli
import uvicorn  # type: ignore
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from .classes import ProjectionRequest, ReportsRequest, ResultsRequest, TableRequest
from .zeno import Zeno

TASK_TYPES = [
    "image-classification",
    "image-segmentation",
    "object-detection",
    "text-classification",
    "audio-classification",
]


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

    if "tests" not in args or not os.path.exists(args["tests"]):
        print("ERROR: Must have 'tests' entry which is a valid directory.")
        sys.exit(1)
    else:
        args["tests"] = Path(os.path.realpath(os.path.join(toml_path, args["tests"])))

    if "task" not in args or args["task"] not in TASK_TYPES:
        print("ERROR: Must have 'task' entry which is one of the following:")
        for t in TASK_TYPES:
            print(t)
        sys.exit(1)

    if "metadata" not in args:
        print("ERROR: Must have 'metadata' entry which must be a CSV or Parquet file.")
        sys.exit(1)
    else:
        args["metadata"] = Path(
            os.path.realpath(os.path.join(toml_path, args["metadata"]))
        )

    if "models" not in args or len(args["models"]) < 1:
        print("ERROR: Must have 'models' entry which have at least one model.")
        sys.exit(1)
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
        args["id_column"] = "id"

    if "data_column" not in args:
        args["data_column"] = "id"

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
        task=args["task"],
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

    @api_app.get("/settings")
    def get_settings():
        return json.dumps(
            {
                "task": zeno.task,
                "idColumn": zeno.id_column,
                "labelColumn": zeno.label_column,
                "dataColumn": zeno.data_column,
                "metadataColumns": zeno.columns,
            }
        )

    @api_app.get("/metrics")
    def get_metrics():
        return json.dumps([s.__name__ for s in zeno.metric_functions.values()])

    @api_app.get("/models")
    def get_models():
        return json.dumps([str(n) for n in zeno.model_names])

    @api_app.get("/slices")
    def get_slices():
        return json.dumps(zeno.get_slices())

    @api_app.get("/delete-slice/{slice_id}")
    def delete_slice(slice_id: str):
        return json.dumps(zeno.delete_slice(unquote(slice_id)))

    @api_app.post("/table")
    def get_table(columns: TableRequest):
        return Response(zeno.get_table(columns.columns))

    @api_app.post("/results")
    def get_results(reqs: ResultsRequest):
        return json.dumps(zeno.get_results(reqs))

    @api_app.get("/reports")
    def get_reports():
        return json.dumps(zeno.get_reports())

    @api_app.post("/update-reports")
    def update_reports(reqs: ReportsRequest):
        return json.dumps(zeno.update_reports(reqs))

    @api_app.post("/projection")
    def run_projection(model: ProjectionRequest):
        return zeno.run_projection(model.model)

    @api_app.websocket("/status")
    async def results_websocket(websocket: WebSocket):
        await websocket.accept()
        previous_status = ""
        while True:
            await asyncio.sleep(1)
            if zeno.status != previous_status:
                previous_status = zeno.status
                await websocket.send_json(
                    {
                        "status": zeno.status,
                        "doneProcessing": zeno.done_processing,
                        "completeColumns": list(zeno.complete_columns),
                    }
                )

    uvicorn.run(app, host="localhost", port=args["port"])  # type: ignore
