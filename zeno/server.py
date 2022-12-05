import asyncio
import json
import os
from pathlib import PosixPath
from typing import List, Union

from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles

from zeno.classes import (
    FilterPredicate,
    FilterPredicateGroup,
    HistogramRequest,
    MetricKey,
    MirrorProject,
    Report,
    Slice,
    StatusResponse,
    TableRequest,
    ZenoSettings,
    ZenoVariables,
)
from zeno.util import NpEncoder
from zeno.zeno_backend import ZenoBackend


def get_server(zeno: ZenoBackend):
    app = FastAPI(title="Frontend API")
    api_app = FastAPI(title="Backend API")

    if zeno.data_path != "" and isinstance(zeno.data_path, PosixPath):
        app.mount("/data", StaticFiles(directory=zeno.data_path), name="static")
    if zeno.label_path != "":
        app.mount("/labels", StaticFiles(directory=zeno.label_path), name="static")

    app.mount(
        "/cache",
        StaticFiles(directory=zeno.cache_path),
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
            view=zeno.view,
            id_column=zeno.id_column,
            label_column=zeno.label_column,
            data_column=zeno.data_column,
            data_origin="/data/"
            if isinstance(zeno.data_path, PosixPath)
            else zeno.data_path,
            metadata_columns=zeno.columns,
            samples=zeno.samples,
            totalSize=zeno.df.shape[0],
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

    @api_app.post("/set-folders")
    def set_folders(folders: List[str]):
        zeno.set_folders(folders)

    @api_app.post("/set-reports")
    def update_reports(reqs: List[Report]):
        zeno.set_reports(reqs)

    @api_app.post("/get-filtered-ids")
    def get_filtered_ids(req: List[Union[FilterPredicateGroup, FilterPredicate]]):
        return json.dumps(zeno.get_filtered_ids(req))

    @api_app.post("/get-filtered-table")
    def get_filtered_table(req: TableRequest):
        return zeno.get_filtered_table(req)

    @api_app.post("/calculate-histograms")
    def calculate_histograms(req: HistogramRequest):
        return json.dumps(zeno.calculate_histograms(req), cls=NpEncoder)

    @api_app.post("/create-new-slice")
    def create_new_slice(req: Slice):
        zeno.create_new_slice(req)

    @api_app.post("/delete-slice")
    def delete_slice(slice_name: List[str]):
        zeno.delete_slice(slice_name[0])

    @api_app.post("/get-metrics-for-slices")
    def get_metrics_for_slices(reqs: List[MetricKey]):
        return json.dumps(zeno.get_metrics_for_slices(reqs))

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

    return app
