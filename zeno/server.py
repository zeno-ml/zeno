import asyncio
import json
import os

import uvicorn  # type: ignore
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from zeno.classes import AnalysisModel

from .zeno import Zeno


def run_background_processor(conn, args):
    zeno = Zeno(
        metadata_path=args.metadata[0],
        task=args.task[0],
        test_files=args.__dict__["test-files"],
        models=args.models,
        batch_size=args.batch_size,
        id_column=args.id_column,
        label_column=args.label_column,
        data_path=args.data_path,
        cache_path=args.cache_path,
    )

    zeno.start_processing()

    while True:
        case, options = conn.recv()

        if case == "GET_SETTINGS":
            conn.send(
                json.dumps(
                    {
                        "task": zeno.task,
                        "idColumn": zeno.id_column,
                        "labelColumn": zeno.label_column,
                        "port": args.port,
                    }
                )
            )

        elif case == "GET_METRICS":
            conn.send(json.dumps([s.__name__ for s in zeno.metrics.values()]))

        elif case == "GET_MODELS":
            conn.send(json.dumps([str(n) for n in zeno.model_names]))

        elif case == "GET_TABLE":
            conn.send(zeno.get_table())

        elif case == "RUN_ANALYSIS":
            zeno.run_analysis(options.requests)
            conn.send("")

        elif case == "GET_RESULTS":
            res = zeno.results.values()
            res = [
                {
                    "metric": r.metric,
                    "transform": r.transform,
                    "slice": r.sli,
                    "modelResults": r.model_metrics,
                }
                for r in res
            ]

            sls = zeno.slices.values()
            slices = [
                {
                    "name": s.name,
                    "size": s.size,
                }
                for s in sls
            ]

            conn.send((zeno.status, res, slices))


def run_server(conn, args):
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
    async def get_settings():
        conn.send(("GET_SETTINGS", ""))
        return conn.recv()

    @api_app.get("/slices")
    async def get_slices():
        conn.send(("GET_SLICES", ""))
        return conn.recv()

    @api_app.get("/metrics")
    async def get_metrics():
        conn.send(("GET_METRICS", ""))
        return conn.recv()

    @api_app.get("/models")
    async def get_models():
        conn.send(("GET_MODELS", ""))
        return conn.recv()

    @api_app.get("/table")
    async def get_table():
        conn.send(("GET_TABLE", ""))
        return Response(content=conn.recv())

    @api_app.post("/analysis")
    async def run_analysis(sli: AnalysisModel):
        conn.send(("RUN_ANALYSIS", sli))
        return conn.recv()

    @api_app.websocket("/results")
    async def results_websocket(websocket: WebSocket):
        await websocket.accept()
        previous_status = ""
        while True:
            await asyncio.sleep(1)
            conn.send(("GET_RESULTS", ""))
            res = conn.recv()
            if res[0] != previous_status:
                print("status: " + res[0])
                previous_status = res[0]
                await websocket.send_json(
                    {
                        "status": res[0],
                        "results": res[1],
                        "slices": res[2],
                    }
                )

    uvicorn.run(app, host="localhost", port=args.port)  # type: ignore
