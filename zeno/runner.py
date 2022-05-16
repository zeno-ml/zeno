import argparse
import asyncio
import json
import os
from pathlib import Path

import uvicorn  # type: ignore
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from .classes import ProjectionRequest, ResultsRequest, TableRequest
from .zeno import Zeno

TASK_TYPES = [
    "image-classification",
    "object-detection",
    "text-classification",
    "audio-classification",
]


def __create_parser():
    parser = argparse.ArgumentParser(description="Evaluate ML systems.")
    parser.add_argument(
        "operation",
        metavar="operation",
        nargs=1,
        type=str,
        choices=["run", "preprocess"],
        help="Whether to run Zeno or preprocess data.",
    )
    parser.add_argument(
        "--tests",
        dest="tests",
        type=Path,
        nargs=1,
        help="Path to folder with Zeno function files.",
    )
    parser.add_argument(
        "--metadata",
        nargs=1,
        type=Path,
        help="CSV or Parquet file with metadata for each instance,"
        + " at minimum a column with file names.",
    )
    parser.add_argument(
        "--data-path",
        dest="data_path",
        nargs="?",
        type=Path,
        default="",
        help="Folder or URL with data instances identified"
        + "by the id-column option in the metadata file.",
    )
    parser.add_argument(
        "--models",
        dest="models",
        nargs="+",
        help="Directory with model files or list of model files/names.",
    )
    parser.add_argument(
        "--id-column",
        dest="id_column",
        default="id",
        type=str,
        nargs="?",
        help="Column with the ID used retrieve data files AND for caching",
    )
    parser.add_argument(
        "--label-column",
        dest="label_column",
        default="label",
        type=str,
        nargs="?",
        help="Column with the ground truth label for instances.",
    )
    parser.add_argument(
        "--task",
        nargs=1,
        choices=TASK_TYPES,
        type=str,
        help="The type of task to be analyzed.",
    )
    parser.add_argument(
        "--batch-size",
        dest="batch_size",
        nargs="?",
        default=64,
        type=int,
        help="Batch size of passed model predictions",
    )
    parser.add_argument(
        "--cache-path",
        dest="cache_path",
        nargs="?",
        type=Path,
        default="./.zeno_cache/",
        help="Folder for caching results of slicers and metrics.",
    )
    parser.add_argument(
        "--port",
        dest="port",
        nargs="?",
        type=int,
        default=8000,
        help="IP port to run Zeno on.",
    )
    return parser


def main():
    parser = __create_parser()
    args = parser.parse_args()
    run_zeno(args)


def run_zeno(args):
    zeno = Zeno(
        metadata_path=args.metadata[0],
        task=args.task[0],
        test_files=args.tests,
        models=args.models,
        batch_size=args.batch_size,
        id_column=args.id_column,
        label_column=args.label_column,
        data_path=args.data_path,
        cache_path=args.cache_path,
    )

    zeno.start_processing()
    if args.operation[0] == "preprocess":
        zeno.done_inference.wait()
        return

    app = FastAPI(title="Frontend API")
    api_app = FastAPI(title="Backend API")

    if args.data_path != "":
        app.mount("/static", StaticFiles(directory=args.data_path), name="static")

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
                "metadata": zeno.metadata,
                "port": args.port,
            }
        )

    @api_app.get("/metrics")
    def get_metrics():
        return json.dumps([s.__name__ for s in zeno.metrics.values()])

    @api_app.get("/models")
    def get_models():
        return json.dumps([str(n) for n in zeno.model_names])

    @api_app.post("/table")
    def get_table(columns: TableRequest):
        return Response(zeno.get_table(columns.columns))

    @api_app.post("/results")
    def get_results(reqs: ResultsRequest):
        return json.dumps(zeno.get_results(reqs))

    @api_app.post("/projection")
    def run_projection(model: ProjectionRequest):
        return zeno.run_projection(model.model)

    @api_app.websocket("/status")
    async def results_websocket(websocket: WebSocket):
        await websocket.accept()
        previous_status = ""
        while True:
            await asyncio.sleep(1)

            sls = zeno.slices.values()
            slices = [
                {
                    "name": s.name,
                    "type": s.slice_type,
                    "size": s.size,
                }
                for s in sls
            ]

            if zeno.status != previous_status:
                previous_status = zeno.status
                await websocket.send_json(
                    {
                        "status": zeno.status,
                        "slices": slices,
                        "columns": list(zeno.complete_columns),
                    }
                )

    uvicorn.run(app, host="localhost", port=args.port)  # type: ignore
