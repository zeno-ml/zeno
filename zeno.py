#!/usr/bin/env python3

import argparse
import asyncio
import json
import os
import sys
from multiprocessing import Manager, Pipe, Process

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from zeno_api import Zeno

parser = argparse.ArgumentParser()
parser.add_argument('--test-files', dest="test_files", nargs='+',
                    help='Python files with slicers or testers')
parser.add_argument('--models', dest="models", nargs='+',
                    help='Paths or names of models')
parser.add_argument('--metadata', dest="metadata", nargs=1,
                    help='Csv of metadata')
parser.add_argument('--data-path', dest="data_path", nargs='?', default="./",
                    help='Filepath of files')
parser.add_argument('--id-column', dest="id_column", default="id", nargs='?',
                    help='Column with ID to retrieve data files AND use for caching')
parser.add_argument('--batch-size', dest="batch_size", nargs='?',
                    default=64, type=int, help='Batch size for predictions')


def run_processor(conn, args):
    zeno = Zeno(
        metadata_path=args.metadata[0],
        test_files=args.test_files,
        models=args.models,
        # batch_size=args.batch_size,
        id_column=args.id_column,
        data_path=args.data_path
    )

    zeno.initialize_watchdog()
    zeno.start_processing()

    while True:
        out = conn.recv()

        if out == "GET_SLICERS":
            slicers = zeno.get_slicers()
            conn.send(json.dumps([
                {"name": s.name,
                 "source": s.source,
                 "slices": list(s.slices.keys())}
                for s in slicers]))

        if out == "GET_TESTERS":
            testers = zeno.get_testers()
            conn.send(json.dumps([
                {"name": s.name,
                 "source": s.source}
                for s in testers]))

        if out == "GET_SLICES":
            slices = zeno.get_slices()
            conn.send(json.dumps([
                {"name": s.name,
                 "size": s.size}
                for s in slices]))

        if out == "GET_DATA":
            conn.send(zeno.get_metadata_bytes())

        if out == "GET_RESULTS":
            res = zeno.get_results()
            res = [{
                "testerName": r.tester_name,
                "sliceName": r.slice_name,
                "sliceSize": r.slice_size,
                "modelResults": r.model_results
            } for r in res]
            conn.send((zeno.get_status(), json.dumps(res)))


def run_server(conn):
    app = FastAPI(title="Frontend API")
    api_app = FastAPI(title="Backend API")

    app.mount('/api', api_app)
    app.mount('/', StaticFiles(directory="frontend/public",
                               html=True), name="static")

    @ api_app.get("/slicers")
    def get_slicers():
        conn.send("GET_SLICERS")
        return conn.recv()

    @ api_app.get("/slices")
    def get_slices():
        conn.send("GET_SLICES")
        return conn.recv()

    @ api_app.get("/slice/{slice}")
    def get_slice(slice):
        conn.send("GET_SLICE")
        return conn.recv()

    @ api_app.get("/testers")
    def get_testers():
        conn.send("GET_TESTERS")
        return conn.recv()

    @ api_app.get("/data")
    def get_data():
        conn.send("GET_DATA")
        return Response(content=conn.recv())

    @ api_app.websocket("/results")
    async def results_websocket(websocket: WebSocket):
        await websocket.accept()
        previous_status = ""
        while True:
            await asyncio.sleep(.5)
            conn.send("GET_RESULTS")
            res = conn.recv()
            if res[1] != previous_status:
                print(res[0])
                previous_status = res[1]
                await websocket.send_json({'status': res[0], 'results': res[1]})

    uvicorn.run(app, host="localhost", port=8000)


if __name__ == "__main__":
    args = parser.parse_args()

    server_conn, processor_conn = Pipe()
    server_process = Process(target=run_server, args=(server_conn,))
    processing_process = Process(
        target=run_processor, args=(processor_conn, args,))

    server_process.start()
    processing_process.start()
    server_process.join()
