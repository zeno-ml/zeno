#!/usr/bin/env python3

import argparse
import inspect
import json
import sys
import pyarrow as pa
from pyarrow import csv
from importlib import import_module
from inspect import getmembers, isfunction
import pandas as pd
from io import BytesIO

import uvicorn
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

parser = argparse.ArgumentParser()
parser.add_argument('results', metavar='results', nargs='?',
                    help='restulst JSON from mltest')
parser.add_argument('--tests', metavar='tests', nargs='+',
                    help='python modules with slicers or tests')
parser.add_argument('--data', metavar='data', nargs='?',
                    help='csv of metadata')

api_app = FastAPI(title="Backend API")

app = FastAPI(title="Frontend API")
app.mount('/api', api_app)
app.mount('/', StaticFiles(directory="frontend/public", html=True), name="static")

res_file = ""
df = pd.DataFrame()


@api_app.get("/results")
def results():
    print(res_file)
    with open(res_file, 'r') as f:
        r = json.loads(f.read())
        print(r)
        return json.dumps(r)


@api_app.get("/slicers")
def slicers():
    model_fns = []
    for mod in args.tests:
        print(mod)
        out = import_module(mod)
        model_fns = model_fns + [f[1] for f in getmembers(out) if isfunction(
            f[1]) and hasattr(f[1], "mlslicer")]
    return json.dumps([inspect.getsource(fn) for fn in model_fns])


@api_app.get("/tests")
def tests():
    model_fns = []
    for mod in args.tests:
        print(mod)
        out = import_module(mod)
        model_fns = model_fns + [f[1] for f in getmembers(out) if isfunction(
            f[1]) and hasattr(f[1], "mltest")]
    return json.dumps([inspect.getsource(fn) for fn in model_fns])


@api_app.get("/data")
def data():
    return Response(content=df)


@api_app.post("/runanalysis")
def run_analysis():
    return "running analysis"


if __name__ == "__main__":
    args = parser.parse_args()
    if args.data:
        df = csv.read_csv(args.data)
        buf = pa.BufferOutputStream()
        with pa.ipc.new_file(buf, df.schema) as writer:
            writer.write_table(df)
        df = bytes(buf.getvalue())

    if args.results:
        res_file = args.results
        uvicorn.run(app, host="localhost", port=8000)
    else:
        print("ERROR: Please pass as an argument the results file from mltest")
        sys.exit(1)
