import asyncio
import json
import os

import uvicorn  # type: ignore
from fastapi import FastAPI, Request, WebSocket
from fastapi.exceptions import RequestValidationError
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from zeno.classes import AnalysisModel, SliceModel

from .zeno import Zeno


def run_background_processor(conn, args):
    zeno = Zeno(
        metadata_path=args.metadata[0],
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

        if case == "GET_SLICES":
            slices = zeno.slices.values()
            ret = [
                {
                    "name": s.name,
                    "size": s.size,
                }
                for s in slices
            ]

            conn.send(json.dumps(ret))

        if case == "GET_METRICS":
            testers = zeno.metrics.values()
            conn.send(json.dumps([{"name": s.__name__, "source": ""} for s in testers]))

        if case == "GET_TABLE":
            conn.send(zeno.get_table(options))

        if case == "RUN_ANALYSIS":
            conn.send(zeno.get_result(options.requests))

        if case == "GET_RESULTS":
            res = zeno.results.values()
            res = [
                {
                    "id": hash(r),
                    "metric": r.metric,
                    "transform": r.transform,
                    "slice": r.sli,
                    "sliceSize": r.slice_size,
                    "modelResults": r.model_metrics,
                }
                for r in res
            ]
            conn.send((zeno.status, res, zeno.id_column, zeno.label_column))


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

    @api_app.get("/slices")
    async def get_slices():
        conn.send(("GET_SLICES", ""))
        return conn.recv()

    @api_app.get("/metrics")
    async def get_metrics():
        conn.send(("GET_METRICS", ""))
        return conn.recv()

    @api_app.post("/table/")
    async def get_table(sli: SliceModel):
        conn.send(("GET_TABLE", sli.name))
        return Response(content=conn.recv())

    @api_app.post("/analysis/")
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
                print("status: ", res[0])
                previous_status = res[0]
                await websocket.send_json(
                    {
                        "status": res[0],
                        "results": res[1],
                        "id_column": res[2],
                        "label_column": res[3],
                    }
                )

    @api_app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):

        exc_str = f"{exc}".replace("\n", " ").replace("   ", " ")
        # or logger.error(f'{exc}')
        print(request, exc_str)
        return

    uvicorn.run(app, host="localhost", port=8000)  # type: ignore
