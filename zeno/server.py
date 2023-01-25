"""
The FastAPI server for the Zeno frontend. Hosts both the REST API
and the static files for the frontend.
"""

import asyncio
import json
import os
from typing import List, Union

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.staticfiles import StaticFiles

from zeno.classes.base import ZenoColumn
from zeno.classes.classes import (
    EmbedProject2DRequest,
    EntryRequest,
    MetricKey,
    StatusResponse,
    TableRequest,
    ZenoSettings,
    ZenoVariables,
)
from zeno.classes.metadata import HistogramBucket, HistogramRequest
from zeno.classes.report import Report
from zeno.classes.slice import FilterPredicate, FilterPredicateGroup, Slice
from zeno.data_pipeline.zeno_backend import ZenoBackend


def get_server(zeno: ZenoBackend):
    app = FastAPI(title="Frontend API")
    api_app = FastAPI(title="Backend API")

    if zeno.data_path != "" and os.path.exists(zeno.data_path):
        app.mount("/data", StaticFiles(directory=zeno.data_path), name="static")
    if zeno.label_path != "" and os.path.exists(zeno.label_path):
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
            data_origin="/data/" if os.path.exists(zeno.data_path) else zeno.data_path,
            metadata_columns=zeno.columns,
            samples=zeno.samples,
            totalSize=zeno.df.shape[0],
        )

    @api_app.get("/initialize", response_model=ZenoVariables)
    def get_initial_info():
        return ZenoVariables(
            metrics=list(zeno.metric_functions.keys()),
            models=[str(n) for n in zeno.model_names],
            folders=zeno.folders,
        )

    @api_app.get("/slices")
    def get_slices():
        return json.dumps(zeno.get_slices())

    @api_app.get("/reports")
    def get_reports():
        return json.dumps([r.dict(by_alias=True) for r in zeno.get_reports()])

    @api_app.post("/folders")
    def set_folders(folders: List[str]):
        zeno.set_folders(folders)

    @api_app.post("/reports")
    def update_reports(reqs: List[Report]):
        zeno.set_reports(reqs)

    @api_app.post("/filtered-ids")
    def get_filtered_ids(req: List[Union[FilterPredicateGroup, FilterPredicate]]):
        return json.dumps(zeno.get_filtered_ids(req))

    @api_app.post("/filtered-table")
    def get_filtered_table(req: TableRequest):
        return zeno.get_filtered_table(req)

    @api_app.post("/histograms", response_model=List[List[HistogramBucket]])
    def get_histogram_buckets(req: List[ZenoColumn]):
        return zeno.get_histogram_buckets(req)

    @api_app.post("/histogram-counts")
    def calculate_histogram_counts(req: HistogramRequest):
        return zeno.get_histogram_counts(req)

    @api_app.post("/histogram-metrics")
    def calculate_histogram_metrics(req: HistogramRequest):
        return zeno.get_histogram_metrics(req)

    @api_app.post("/slice")
    def create_new_slice(req: Slice):
        zeno.create_new_slice(req)

    @api_app.delete("/slice")
    def delete_slice(slice_name: List[str]):
        zeno.delete_slice(slice_name[0])

    @api_app.post("/slice-metrics")
    def get_metrics_for_slices(reqs: List[MetricKey]):
        return json.dumps(zeno.get_metrics_for_slices(reqs))

    @api_app.get("/embed-exists/{model}")
    def embed_exists(model: str):
        """
        Checks if embedding exists for a model.
        Returns the boolean True or False directly
        """
        exists = zeno.embed_exists(model)
        return exists

    @api_app.post("/embed-project")
    def project_embed_into_2D(req: EmbedProject2DRequest):
        points = zeno.project_embed_into_2D(req.model)
        return points

    @api_app.post("/entry")
    def get_df_row_entry(req: EntryRequest):
        try:
            entry = zeno.df.loc[req.id, :]
            if len(req.columns) > 0:
                entry = entry[list(map(str, req.columns))]
            json_entry = entry.to_json()
            return json_entry
        except KeyError:
            raise HTTPException(
                status_code=404, detail=f"Entry with id={req.id} not found"
            )

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
