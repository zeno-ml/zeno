#!/usr/bin/env python3

import argparse
import asyncio
import inspect
import json
import shelve
import sys
from concurrent.futures import ThreadPoolExecutor
from importlib import import_module
from inspect import getmembers, isfunction
from io import BytesIO
import importlib.util

import pandas as pd
import pyarrow as pa
import uvicorn
from fastapi import BackgroundTasks, FastAPI, WebSocket
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from pyarrow import csv
from starlette.responses import RedirectResponse
from tqdm import tqdm

parser = argparse.ArgumentParser()
parser.add_argument('--tests', dest="tests", nargs='+',
                    help='Python modules with slicers or testers')
parser.add_argument('--models', dest="models", nargs='+',
                    help='Paths or names of models')
parser.add_argument('--data', dest="data", nargs=1,
                    help='Csv of metadata')
parser.add_argument('--data-path', dest="data_path", nargs='?', default="./",
                    help='Filepath of files')
parser.add_argument('--id-column', dest="id_column", default="id", nargs='?',
                    help='Column with ID to retrieve data files AND use for caching')
parser.add_argument('--batch-size', dest="batch_size", nargs='?',
                    default=64, type=int, help='Batch size for predictions')

api_app = FastAPI(title="Backend API")

app = FastAPI(title="Frontend API")
app.mount('/api', api_app)
app.mount('/', StaticFiles(directory="frontend/public", html=True), name="static")

test_functions = {}
test_sources = {}
slicing_functions = {}
slices = {}
loaded_models = {}
data_name = ''

model_loader = None
model_predictor = None

model_names = []
batch_size = 64
id_column = "id"
data_path = "./"


res_file = ""
analysis_res = ""
df = ""
dfp = pd.DataFrame()
data_bytes = b''


# Return a prediction function for a given model that uses
# cached outputs if possible
def cached_model_builder(model_name, cache):
    def cached_model(instances):
        outputs = [None]*len(instances)
        to_predict = []
        predicted = []

        # Get all instances from cache possible
        for i, inst in enumerate(instances):
            if inst in cache:
                outputs[i] = cache.get(inst)
            else:
                to_predict.append(inst)

        if len(to_predict) > 0:
            if len(to_predict) < batch_size:
                predicted = model_predictor(
                    loaded_models[model_name],
                    to_predict)
            else:
                for i in range(0, len(to_predict), batch_size):
                    predicted.extend(model_predictor(
                        loaded_models[model_name],
                        to_predict[i:i+batch_size]))

            j = 0
            for i, inst in enumerate(outputs):
                if inst is None:
                    outputs[i] = predicted[j]
                    cache[instances[i]] = outputs[i]
                    j = j + 1

        return outputs

    return cached_model


class TestTask:

    def __init__(self):
        self.results = {
            "status": 'starting',
            "data": []
        }
        self.running = False

    def run_analysis(self):
        # If we already have results or are processing, return
        if self.results["status"] == 'done' or self.running:
            return

        if len(loaded_models) == 0:
            for model_name in model_names:
                loaded_models[model_name] = model_loader(model_name)

        model_caches = {}
        # Create cache files for models
        for i, model_name in enumerate(model_names):
            model_caches[model_name] = shelve.open(
                '.model_' + model_name.replace('/', '_') + str(i) + ".cache", writeback=True)

        result_cache = shelve.open(
            ".mltest_" + data_name.replace('/', '_'), writeback=True)

        # Run all testing functions on slices
        results = []
        for i, (slice_name, sli) in enumerate(slices.items()):
            for j, test in enumerate(sli['tests']):
                self.results['status'] = 'wtf'
                # self.results["status"] = 'Running test ' + test + " (" + str(j + 1) + '/' + str(len(
                #     sli['tests'])) + ") for slice " + slice_name + ' (' + str(i + 1) + '/' + str(len(slices.items())) + '),' + sli["data"].shape[0] + ' instances'
                if slice_name + test in result_cache:
                    results.append(result_cache[slice_name + test])
                else:
                    results.append({
                        "test": test,
                        "slice": slice_name,
                        "size": sli["size"],
                    })
                    for model_name in model_names:
                        results[-1]["model_" + model_name] = test_functions[test](
                            sli["data"],
                            cached_model_builder(
                                model_name, model_caches[model_name]),
                            id_column
                        )
                        model_caches[model_name].sync()

                    result_cache[slice_name + test] = results[-1]
        print('done?')
        for model_name in model_names:
            model_caches[model_name].close()
        result_cache.close()

        self.results['data'] = json.dumps(results)
        self.results['status'] = "done"

    def get_results(self):
        return self.results

    def set_status(self, status):
        self.results['status'] = status


test_task = TestTask()


@ api_app.get("/slice/{slice}")
def get_slice(slice):
    return slices[slice]["data"].sample(10).to_json()


@ api_app.get("/slices")
def get_slices():
    return json.dumps([{"name": k, "size": s["size"], "tests": s["tests"], "slicer": s["slicer"]} for k, s in slices.items()])


@ api_app.get("/slicers")
def get_slicers():
    return json.dumps(slicing_functions)


@ api_app.get("/tests")
def get_tests():
    return json.dumps(test_sources)


@ api_app.get("/data")
def get_data():
    return Response(content=data_bytes)


@ api_app.post("/runanalysis")
async def request_analysis(background_tasks: BackgroundTasks):
    background_tasks.add_task(test_task.run_analysis)
    return {"message": "Notification sent in the background"}


async def track_results(websocket):
    old_status = ''
    while test_task.get_results()["status"] != "done":
        print(test_task.get_results()["status"])
        new_status = test_task.get_results()["status"]
        if new_status != old_status:
            old_status = new_status
            await websocket.send_json(test_task.get_results())
        await asyncio.sleep(1)


@api_app.websocket("/results")
async def results_websocket(websocket: WebSocket):

    await websocket.accept()

    while True:
        data = await websocket.receive_text()

        loop = asyncio.get_running_loop()
        pool = ThreadPoolExecutor(max_workers=2)

        t = loop.run_in_executor(
            pool, test_task.run_analysis)
        a = loop.run_in_executor(pool, track_results, websocket)

        # track_results(websocket)

        try:
            await asyncio.gather(t, a)
        except Exception as e:
            test_task.set_status("ERROR: " + str(e))

        await websocket.send_json(test_task.get_results())
        pool.shutdown()


def initialize_slices():
    # Find all related functions
    global model_predictor
    global model_loader

    for mod in args.tests:
        # test_module = import_module(mod)
        spec = importlib.util.spec_from_file_location("module.name", mod)
        test_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(test_module)
        for func in getmembers(test_module):
            if isfunction(func[1]):
                if hasattr(func[1], "loader"):
                    if model_loader is None:
                        model_loader = func[1]
                    else:
                        print("Multiple model loaders found, can only have one")
                        sys.exit(1)
                if hasattr(func[1], "predictor"):
                    if model_predictor is None:
                        model_predictor = func[1]
                    else:
                        print("Multiple model predictors found, can only have one")
                        sys.exit(1)
                if hasattr(func[1], "slicer"):
                    slicing_functions[func[0]] = func[1]
                if hasattr(func[1], "tester"):
                    # Function objects for testing
                    test_functions[func[0]] = func[1]
                    # Function source to send to frontend
                    test_sources[func[0]] = inspect.getsource(func[1])

    # Run all slicing functions on data
    for name, sli in slicing_functions.items():
        # Slicing functions use Pandas
        sliced_out = sli(dfp)
        slice_names = []

        # If slicer returns multiple slices, create a slice for each
        if type(sliced_out) == list:
            for slicer in sliced_out:
                # Join slice names with backslash
                n = "/".join([sli.__name__, slicer[0]])
                slice_names.append(n)
                slices[n] = {
                    # The dataframe slice
                    "data": slicer[1],
                    # Number of instances in the slice
                    "size": slicer[1].shape[0],
                    # Which tests are associated with this slice
                    "tests": sli.tests,
                    # The name of the slicer for this slice
                    "slicer": sli.__name__,
                }
        # Otherwise, add the single slice
        else:
            slice_names.append(sli.__name__)
            slices[sli.__name__] = {
                "data": sliced_out,
                "size": sliced_out.shape[0],
                "tests": sli.tests,
                "slicer": sli.__name__,
            }

        # Add the generated slices to the slicer metadata
        slicing_functions[name] = {
            "name": name,
            "fn": inspect.getsource(sli),
            "slices": slice_names
        }


if __name__ == "__main__":
    args = parser.parse_args()

    data_name = args.data[0]
    # Read CSV as Arrow for data transfer to Arquero on frontend
    df = csv.read_csv(args.data[0])
    # Read metadata as Pandas for slicing
    dfp = df.to_pandas()

    # Write Arrow to bytes to send to frontend
    buf = pa.BufferOutputStream()
    with pa.ipc.new_file(buf, df.schema) as writer:
        writer.write_table(df)
    data_bytes = bytes(buf.getvalue())

    batch_size = args.batch_size
    model_names = args.models
    id_column = args.id_column
    data_path = args.data_path

    initialize_slices()

    uvicorn.run(app, host="localhost", port=8000)
