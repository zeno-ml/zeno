import importlib
from inspect import getmembers, isfunction, getsource
from concurrent.futures import ThreadPoolExecutor

from pandas import DataFrame
import pyarrow as pa
from pyarrow import csv
import shelve
import asyncio
import threading

import os
from zeno_util import cached_model_builder, TestFileUpdateHandler
from watchdog.observers import Observer


class Slicer:
    def __init__(self, name, func):
        self.name = name
        self.func = func
        self.source = getsource(self.func)
        self.data: DataFrame = None
        self.slices: Dict[Slice] = {}

    def slice_data(self, data):
        slicer_output = self.func(data)

        # If slicer returns multiple slices, create a slice for each
        if type(slicer_output) == list:
            for output_slice in slicer_output:
                # Join slice names with backslash
                name = "/".join([self.name, output_slice[0]])
                self.slices[name] = Slice(
                    name,
                    output_slice[1],
                    output_slice[1].shape[0],
                    self.func.tests,
                    self.name
                )
        # Otherwise, add the single slice
        else:
            self.slices[self.name] = Slice(
                self.name,
                slicer_output,
                slicer_output.shape[0],
                self.func.tests,
                self.name
            )

        return self.slices


class Slice:
    def __init__(
            self,
            name,
            data,
            size,
            tests,
            slicer):
        self.name = name
        self.data = data
        self.size = size
        self.tests = tests
        self.slicer = slicer

    def get_name(self):
        return self.name


class Tester:
    def __init__(self, name, func):
        self.name = name,
        self.func = func
        self.source = getsource(self.func)


class Result:
    def __init__(self, tester_name, slice_name, slice_size):
        self.tester_name = tester_name
        self.slice_name = slice_name
        self.slice_size = slice_size
        self.model_results = {}

    def set_model_outputs(self, model_results):
        self.model_results = model_results

    def __str__(self):
        return "Test {0} for slice {1}, size {2}".format(
            self.tester_name, self.slice_name, self.slice_size)


class Zeno(object):
    def __init__(self,
                 metadata_path,
                 test_files,
                 models,
                 batch_size=16,
                 id_column="id",
                 data_path=""
                 ):
        self.metadata_path = metadata_path
        self.test_files = test_files
        self.model_names = models
        self.batch_size = batch_size
        self.id_column = id_column
        self.data_path = data_path
        self.status = "initializing"

        self.slicers: Dict[Slicer] = {}
        self.testers: Dict[Tester] = {}
        self.slices: Dict[Slice] = {}

        self.model_loader: Callable = None
        self.model_predictor: Callable = None

        self.loaded_models = {}
        self.model_caches = {}

        self.results = []
        self.res_runner = None

        self._loop = None

        # Read CSV as Arrow for data transfer to Arquero on frontend
        self.metadata_arrow = csv.read_csv(metadata_path)
        # Read metadata as Pandas for slicing
        self.metadata_df: DataFrame = self.metadata_arrow.to_pandas()

        # Write Arrow to bytes to send to frontend
        buf = pa.BufferOutputStream()
        with pa.ipc.new_file(buf, self.metadata_arrow.schema) as writer:
            writer.write_table(self.metadata_arrow)
        self.metadata_bytes = bytes(buf.getvalue())

        print('instantiated')

    async def process(self):
        print("running analysis")

        self.slice_data()

        if len(self.loaded_models) == 0:
            for i, model_name in enumerate(self.model_names):
                self.set_status(" ".join(("Loading model ",
                                          model_name, str(i + 1), "/", str(len(self.model_names)))))
                self.loaded_models[model_name] = self.model_loader(model_name)

        # Create cache files for models
        model_caches = {}
        for i, model_name in enumerate(self.model_names):
            model_caches[model_name] = shelve.open(
                '.model_' + model_name.replace('/', '_') + str(i) + ".cache", writeback=True)

        result_cache = shelve.open(
            ".mltest_" + self.metadata_path.replace('/', '_'), writeback=True)

        self.results = []
        # Run all testing functions on slices
        for i, sli in enumerate(self.slices.values()):
            for j, test in enumerate(sli.tests):
                self.status = "Running test {0} ({1}/{2}) for slice {3} ({4}/{5}), {6} instances".format(test, str(
                    j + 1), str(len(sli.tests)), sli.name, str(i + 1), str(len(self.slices.items())), str(sli.data.shape[0]))

                if sli.name + test in result_cache:
                    self.results.append(result_cache[sli.name + test])
                else:
                    res = Result(test, sli.name, sli.size)
                    model_outputs = {}
                    for model_name in self.model_names:
                        model_outputs['model_' + model_name] = \
                            self.testers[test].func(
                                sli.data,
                                cached_model_builder(
                                    model_name, model_caches[model_name], self.loaded_models, self.model_predictor, self.batch_size, self.id_column, self.data_path),
                                self.id_column
                        )

                        model_caches[model_name].sync()
                    res.set_model_outputs(model_outputs)
                    result_cache[sli.name + test] = res
                    self.results.append(res)

        for model_name in self.model_names:
            model_caches[model_name].close()
        result_cache.close()

        self.status = "done"

    def get_results(self):
        return (self.status, self.results)

    def set_status(self, status):
        self.status = status

    def start_processing(self):
        self.parse_testing_files()
        self.run_tests()

    def run_tests(self):
        if not self._loop:
            self._loop = asyncio.new_event_loop()
            threading.Thread(target=self._loop.run_forever,
                             daemon=True).start()
        self._loop.call_soon_threadsafe(asyncio.create_task, self.process())

    def slice_data(self):
        self.slices = {}
        for name, slicer in self.slicers.items():
            self.status = "Slicing data for " + name
            self.slices = {**self.slices, **
                           slicer.slice_data(self.metadata_df)}
        self.status = "Done slicing"

    def initialize_watchdog(self):
        observer = Observer()
        event_handler = TestFileUpdateHandler(
            [os.path.abspath(t) for t in self.test_files], self.start_processing)
        folders_logged = []
        for test in self.test_files:
            folder = os.path.dirname(test)
            if folder not in folders_logged:
                folders_logged.append(folder)
                observer.schedule(event_handler, folder, recursive=True)
        observer.start()

    def parse_testing_files(self):
        self.model_loader = None
        self.model_predictor = None
        self.slicers = {}
        self.testers = {}

        for test_file in self.test_files:
            spec = importlib.util.spec_from_file_location(
                "module.name", test_file)
            test_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(test_module)

            for func_name, func in getmembers(test_module):
                if isfunction(func):
                    if hasattr(func, "loader"):
                        if self.model_loader is None:
                            self.model_loader = func
                        else:
                            print("Multiple model loaders found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "predictor"):
                        if self.model_predictor is None:
                            self.model_predictor = func
                        else:
                            print(
                                "Multiple model predictors found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "slicer"):
                        self.slicers[func_name] = Slicer(
                            func_name, func)
                    if hasattr(func, "tester"):
                        self.testers[func_name] = Tester(
                            func_name, func)

    def get_metadata_path(self):
        return self.metadata_path

    def get_metadata_bytes(self):
        return self.metadata_bytes

    def get_testers(self):
        return self.testers.values()

    def get_results(self):
        return self.results

    def get_slicers(self):
        return self.slicers.values()

    def get_slices(self):
        return self.slices.values()

    def get_status(self):
        return self.status
