#!/usr/bin/env python3

import argparse
import inspect
import json
import sys
from importlib import import_module
from inspect import getmembers, isfunction
from io import BytesIO
import shelve
from time import sleep

import pandas as pd
import pyarrow as pa
import uvicorn
from fastapi import BackgroundTasks, FastAPI
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pyarrow import csv
from starlette.responses import RedirectResponse

parser = argparse.ArgumentParser()
parser.add_argument('--tests', metavar='tests', nargs='+',
                    help='python modules with slicers or tests')
parser.add_argument('--data', metavar='data', nargs='?',
                    help='csv of metadata')

api_app = FastAPI(title="Backend API")

app = FastAPI(title="Frontend API")
app.mount('/api', api_app)
app.mount('/', StaticFiles(directory="frontend/public", html=True), name="static")

test_fns = {}
slice_fns = []
model_fns = []

slices = {}

res_file = ""
analysis_res = ""
df = ""
dfp = pd.DataFrame()
data_bytes = b''


def cache_builder(pred, cache):
    def cacher(inst):
        if cache.get(inst):
            return cache.get(inst)
        else:
            cache[inst] = pred(inst)
            return cache.get(inst)
    return cacher


class TestTask:

    def __init__(self):
        self.results = ''
        self.running = False

    def run_analysis(self):
        if len(self.get_results()) > 0 or self.running:
            return

        model_caches = {}
        # Create cache files for models
        for model in model_fns:
            model_caches[model] = shelve.open(
                '.' + model.__name__ + ".cache")

        # Run all testing functions on slices
        results = []
        for name, sli in slices.items():
            for test in sli['tests']:
                results.append({
                    "test": test,
                    "slice": name,
                    "size": sli["size"],
                })
                for model in model_fns:
                    results[-1]["model_" + model.__name__] = test_fns[test](
                        sli["data"], cache_builder(model, model_caches[model]))

        for model in model_fns:
            model_caches[model].close()

        self.results = json.dumps(results)

    def get_results(self):
        return self.results


test_task = TestTask()


@api_app.get("/slicers")
def slicers():
    return json.dumps([{"name": k, "size": s["size"], "tests": s["tests"], "fn": s["fn"]} for k, s in slices.items()])


@api_app.get("/tests")
def tests():
    return json.dumps([inspect.getsource(fn) for fn in [t for t in test_fns.values()]])


@ api_app.get("/data")
def data():
    return Response(content=data_bytes)


@ api_app.post("/runanalysis")
async def request_analysis(background_tasks: BackgroundTasks):
    background_tasks.add_task(test_task.run_analysis)
    return {"message": "Notification sent in the background"}


@ api_app.get("/getresults")
def get_results():
    res = test_task.get_results()
    if res == "":
        return {"loading": 1}
    else:
        return res


if __name__ == "__main__":
    args = parser.parse_args()
    if args.data:
        df = csv.read_csv(args.data)
        dfp = df.to_pandas()
        buf = pa.BufferOutputStream()
        with pa.ipc.new_file(buf, df.schema) as writer:
            writer.write_table(df)
        data_bytes = bytes(buf.getvalue())

    # Find all model functions in given modules
    for mod in args.tests:
        test_module = import_module(mod)
        model_fns = model_fns + [f[1] for f in getmembers(test_module) if isfunction(
            f[1]) and hasattr(f[1], "mlmodel")]
        slice_fns = slice_fns + [f[1] for f in getmembers(test_module) if isfunction(
            f[1]) and hasattr(f[1], "mlslicer")]
        for func in getmembers(test_module):
            if isfunction(func[1]) and hasattr(func[1], "mltest"):
                test_fns[func[0]] = func[1]

    # Run all slicing functions on data
    slices = {}
    for sli in slice_fns:
        sliced_out = sli(dfp)
        if type(sliced_out) == list:
            for slicer in sliced_out:
                slices["/".join([sli.__name__, slicer[0]])] = {
                    "data": slicer[1],
                    "size": slicer[1].shape[0],
                    "tests": sli.tests,
                    "fn": inspect.getsource(sli)}

        else:
            slices[sli.__name__] = {
                "data": sliced_out,
                "size": sliced_out.shape[0],
                "tests": sli.tests,
                "fn": inspect.getsource(sli)}

    uvicorn.run(app, host="localhost", port=8000)
