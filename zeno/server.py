"""
The FastAPI server for the Zeno frontend. Hosts both the REST API
and the static files for the frontend.
"""

import asyncio
import os
from typing import Dict, List, Union

import gradio as gr  # type: ignore
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles

from zeno.backend import ZenoBackend
from zeno.classes.base import ZenoColumn
from zeno.classes.classes import (
    ColorsProjectRequest,
    EmbedProject2DRequest,
    EntryRequest,
    MetricRequest,
    StatusResponse,
    TableRequest,
    ZenoSettings,
    ZenoVariables,
)
from zeno.classes.metadata import HistogramBucket, HistogramRequest, StringFilterRequest
from zeno.classes.projection import Points2D, PointsColors
from zeno.classes.report import Report
from zeno.classes.slice import FilterPredicateGroup, Slice, SliceMetric
from zeno.processing.histogram_processing import (
    filter_by_string,
    histogram_buckets,
    histogram_counts,
    histogram_metrics,
)
from zeno.processing.projection_processing import (
    check_embed_exists,
    project_into_2D,
    projection_colors,
)


def custom_generate_unique_id(route: APIRoute):
    return route.name


def get_server(zeno: ZenoBackend):
    app = FastAPI(title="Frontend API")
    api_app = FastAPI(
        title="Backend API", generate_unique_id_function=custom_generate_unique_id
    )

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

    # If an inference function is provided, mount the gradio app.
    if zeno.inference_function:
        # The input_columns should map to the input_components.
        input_components, output_components, input_columns = zeno.inference_function(
            zeno.zeno_options
        )
        zeno.gradio_input_columns = input_columns

        gradio_app = gr.Interface(
            fn=zeno.single_inference,
            inputs=[
                gr.components.Dropdown(
                    zeno.model_names, value=zeno.model_names[0], label="Model"
                ),
                *input_components,
            ],
            outputs=output_components,
            css="""
                    :root {
                    --button-primary-background-base: #6a1b9a;
                    --button-primary-background-hover: #d2bae9;
                    --button-primary-text-color-base: white;
                    --button-primary-text-color-hover: white;
                    --button-primary-border-color-hover: #6a1b9a;
                    --button-primary-border-color: #6a1b9a;
                    }
                """,
            allow_flagging="never",
            analytics_enabled=False,
        )
        api_app = gr.mount_gradio_app(
            app=api_app,
            blocks=gradio_app,
            path="/gradio",
        )

    @api_app.get("/settings", response_model=ZenoSettings, tags=["zeno"])
    def get_settings():
        return ZenoSettings(
            view=zeno.view,
            id_column=zeno.id_column,
            label_column=zeno.label_column,
            data_column=zeno.data_column,
            calculate_histogram_metrics=zeno.calculate_histogram_metrics,
            inference_view=True if zeno.inference_function else False,
            samples=zeno.samples,
            totalSize=zeno.df.shape[0],
        )

    @api_app.get("/initialize", response_model=ZenoVariables, tags=["zeno"])
    def get_initial_info():
        return ZenoVariables(
            metrics=list(zeno.metric_functions.keys()),
            models=[str(n) for n in zeno.model_names],
            folders=zeno.folders,
        )

    @api_app.get("/slices", response_model=Dict[str, Slice], tags=["zeno"])
    def get_slices():
        return zeno.slices

    @api_app.get("/reports", response_model=List[Report], tags=["zeno"])
    def get_reports():
        return zeno.reports

    @api_app.post("/folders", tags=["zeno"])
    def set_folders(folders: List[str]):
        zeno.set_folders(folders)

    @api_app.post("/reports", tags=["zeno"])
    def update_reports(reqs: List[Report]):
        zeno.set_reports(reqs)

    @api_app.post("/filtered-ids", response_model=str, tags=["zeno"])
    def get_filtered_ids(req: FilterPredicateGroup):
        return zeno.get_filtered_ids(req)

    @api_app.post("/filtered-table", response_model=str, tags=["zeno"])
    def get_filtered_table(req: TableRequest):
        return zeno.get_filtered_table(req)

    @api_app.post(
        "/histograms", response_model=List[List[HistogramBucket]], tags=["zeno"]
    )
    def get_histogram_buckets(req: List[ZenoColumn]):
        return histogram_buckets(zeno.df, req)

    @api_app.post("/histogram-counts", response_model=List[List[int]], tags=["zeno"])
    def calculate_histogram_counts(req: HistogramRequest):
        return histogram_counts(zeno.df, req)

    @api_app.post(
        "/histogram-metrics",
        response_model=List[List[Union[float, None]]],
        tags=["zeno"],
    )
    def calculate_histogram_metrics(req: HistogramRequest):
        return histogram_metrics(zeno.df, zeno.calculate_metric, req)

    @api_app.post("/slice", tags=["zeno"])
    def create_new_slice(req: Slice):
        zeno.create_new_slice(req)

    @api_app.delete("/slice", tags=["zeno"])
    def delete_slice(slice_name: List[str]):
        zeno.delete_slice(slice_name[0])

    @api_app.post("/string-filter", response_model=List[str], tags=["zeno"])
    def filter_string_metadata(req: StringFilterRequest):
        filt_out = filter_by_string(zeno.df, req)
        return filt_out

    @api_app.post("/slice-metrics", response_model=List[SliceMetric], tags=["zeno"])
    def get_metrics_for_slices(req: MetricRequest):
        return zeno.get_metrics_for_slices(req.metric_keys, req.filter_ids)

    @api_app.get("/embed-exists/{model}", response_model=bool, tags=["zeno"])
    def embed_exists(model: str):
        """Checks if embedding exists for a model.
        Returns the boolean True or False directly
        """
        return check_embed_exists(zeno.df, model)

    @api_app.post("/embed-project", tags=["zeno"], response_model=Points2D)
    def project_embed_into_2D(req: EmbedProject2DRequest):
        return project_into_2D(zeno.df, zeno.id_column, req.model, req.column)

    @api_app.post("/colors-project", tags=["zeno"], response_model=PointsColors)
    def get_projection_colors(req: ColorsProjectRequest):
        return projection_colors(zeno.df, req.column)

    @api_app.post("/entry", tags=["zeno"], response_model=str)
    def get_df_row_entry(req: EntryRequest):
        try:
            entry = zeno.df.loc[req.id, :].copy()
            if len(req.columns) > 0:
                entry = entry[list(map(str, req.columns))]

            # Add data prefix to data column depending on type of data_path.
            entry.loc[str(zeno.data_column)] = (
                zeno.data_prefix + entry[str(zeno.data_column)]
            )

            return entry.to_json()
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
                        done_processing=zeno.done_running_inference,
                        complete_columns=zeno.complete_columns,
                    ).json(by_alias=True)
                )

    return app
