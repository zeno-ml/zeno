import asyncio
import os
import shelve
import sys
import threading
from importlib import util
from inspect import getmembers, getsource, isfunction
from typing import Any, Callable, Dict, List, Union

import pandas as pd  # type: ignore
import pyarrow as pa  # type: ignore
from watchdog.observers import Observer  # type: ignore

from .util import cached_model_builder, TestFileUpdateHandler


class Slicer:
    def __init__(self, name: str, func: Callable):
        """Create a slicer

        Args:
            name: Function name
            func: Slicer function
        """
        self.name = name
        self.func = func

        self.metrics = func.metrics  # type: ignore
        self.source = getsource(self.func)
        self.slices: List[str] = []

    def slice_data(self, data, metadata):
        slicer_output = self.func(data, metadata)

        slices_to_return = {}
        # If slicer returns multiple slices, create a slice for each
        if type(slicer_output) == list:
            for output_slice in slicer_output:
                # Join slice names with backslash
                name = ".".join([self.name, output_slice[0]])
                self.slices.append(name)
                slices_to_return[name] = Slice(
                    name,
                    output_slice[1],
                    output_slice[1].shape[0],
                    self.metrics,
                    self.name,
                )
        # Otherwise, add the single slice
        else:
            self.slices.append(self.name)
            slices_to_return[self.name] = Slice(
                self.name,
                slicer_output,
                slicer_output.shape[0],
                self.metrics,
                self.name,
            )

        return slices_to_return


class Slice:
    def __init__(self, name, data, size, tests, slicer):
        self.name = name
        self.data = data
        self.size = size
        self.tests = tests
        self.slicer = slicer

    def get_name(self):
        return self.name


class Metric:
    def __init__(self, name, func):
        self.name = (name,)
        self.func = func
        self.source = getsource(self.func)


class Transform:
    def __init__(self, name, func):
        self.name = (name,)
        self.func = func
        self.source = getsource(self.func)


class Result:
    def __init__(self, metric: str, transform: str, sli: str, slice_size: int):
        self.metric = metric
        self.transform = transform
        self.sli = sli

        self.slice_size = slice_size

        self.model_results: Dict[str, float] = {}

    def set_model_outputs(self, model_results):
        self.model_results = model_results

    def get_model_names(self):
        return list(self.model_results.keys())

    def __str__(self):
        return "Test {0} for slice {1}, size {2}".format(
            self.metric, self.sli, self.slice_size
        )


class Zeno(object):
    def __init__(
        self,
        metadata_path: str,
        test_files: List[str],
        models: List[str],
        batch_size=16,
        id_column="id",
        data_path="",
        cache_path="",
    ):
        self.metadata_path = metadata_path
        self.test_files = test_files
        self.model_names = models
        self.batch_size = batch_size
        self.id_column = id_column
        self.data_path = data_path
        self.cache_path = cache_path
        os.makedirs(self.cache_path, exist_ok=True)
        self.status = "Initializing"

        self.slicers: Dict[str, Slicer] = {}
        self.transforms: Dict[str, Transform] = {}
        self.metrics: Dict[str, Metric] = {}

        self.slices: Dict[str, Slice] = {}

        self.model_loader: Union[Callable, None]
        self.data_loader: Union[Callable, None]

        self.loaded_models: Dict[str, Callable] = {}
        self.model_caches: Dict[str, Callable] = {}

        self.results: List[Result] = []
        self.res_runner = None

        self._loop = None

        # Read metadata as Pandas for slicing
        self.metadata_df = pd.read_csv(metadata_path)
        self.data: List[Any] = []

    def start_processing(self):
        self.__initialize_watchdog()
        self.__parse_testing_files()
        self.__run_tests()

    async def __process(self):
        print("running analysis")

        if self.data_loader:
            self.data = self.data_loader(
                self.metadata_df, self.id_column, self.data_path
            )
        self.__slice_data()

        if len(self.loaded_models) == 0:
            for i, model_name in enumerate(self.model_names):
                self.set_status(
                    " ".join(
                        (
                            "Loading model ",
                            model_name,
                            str(i + 1),
                            "/",
                            str(len(self.model_names)),
                        )
                    )
                )
                if self.model_loader:
                    self.loaded_models[model_name] = self.model_loader(model_name)

        # Create cache files for models
        model_caches = {}
        for i, model_name in enumerate(self.model_names):
            model_caches[model_name] = shelve.open(
                os.path.join(
                    self.cache_path,
                    (".model_" + model_name.replace("/", "_") + str(i) + ".cache"),
                ),
                writeback=True,
            )

        result_cache = shelve.open(
            os.path.join(
                self.cache_path, (".mltest_" + self.metadata_path.replace("/", "_"))
            ),
            writeback=True,
        )

        self.results = []
        # Run all testing functions on slices
        for i, sli in enumerate(self.slices.values()):
            for j, test in enumerate(sli.tests):

                transform = None
                if type(test) in (list, tuple):
                    transform, test = test
                # TODO: check if test is a tuple, if so
                # run the mutation and pass both outputs to the test.

                self.status = (
                    "Running test {0} ({1}/{2}) "
                    + "for slice {3} ({4}/{5}), {6} instances"
                ).format(
                    test,
                    str(j + 1),
                    str(len(sli.tests)),
                    sli.name,
                    str(i + 1),
                    str(len(self.slices.items())),
                    str(sli.data.shape[0]),
                )

                res = Result(test, "a", sli.name, sli.size)
                model_outputs = {}
                for model_name in self.model_names:
                    if sli.name + test + model_name in result_cache:
                        model_outputs["model_" + model_name] = result_cache[
                            sli.name + test + model_name
                        ]
                    else:
                        out = cached_model_builder(
                            model_name,
                            model_caches[model_name],
                            self.loaded_models,
                            self.model_loader,
                            self.batch_size,
                            self.id_column,
                            self.data_path,
                        )(sli.data)
                        output = self.metrics[test].func(
                            sli.data,
                            out,
                            self.id_column,
                        )
                        model_outputs["model_" + model_name] = output
                        result_cache[sli.name + test + model_name] = output

                    model_caches[model_name].sync()
                res.set_model_outputs(model_outputs)
                self.results.append(res)

        for model_name in self.model_names:
            model_caches[model_name].close()
        result_cache.close()

        self.status = "done"

    def __parse_testing_files(self):
        self.model_loader = None
        self.data_loader = None

        self.slicers = {}
        self.metrics = {}
        self.transforms = {}

        for test_file in self.test_files:
            spec = util.spec_from_file_location("module.name", test_file)
            test_module = util.module_from_spec(spec)  # type: ignore
            spec.loader.exec_module(test_module)  # type: ignore

            for func_name, func in getmembers(test_module):
                if isfunction(func):
                    if hasattr(func, "load_model"):
                        if self.model_loader is None:
                            self.model_loader = func
                        else:
                            print("Multiple model loaders found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "load_data"):
                        if self.data_loader is None:
                            self.data_loader = func
                        else:
                            print("Multiple data loaders found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "slicer"):
                        self.slicers[func_name] = Slicer(func_name, func)
                    if hasattr(func, "transform"):
                        self.transforms[func_name] = Transform(func_name, func)
                    if hasattr(func, "metric"):
                        self.metrics[func_name] = Metric(func_name, func)

    def __run_tests(self):
        if not self._loop:
            self._loop = asyncio.new_event_loop()
            threading.Thread(target=self._loop.run_forever, daemon=True).start()
        self._loop.call_soon_threadsafe(asyncio.create_task, self.__process())

    def __slice_data(self):
        self.slices = {}

        for name, slicer in self.slicers.items():
            self.status = "Slicing data for " + name
            self.slices = {
                **self.slices,
                **slicer.slice_data(self.data, self.metadata_df),
            }
        self.status = "Done slicing"

    def __initialize_watchdog(self):
        observer = Observer()
        event_handler = TestFileUpdateHandler(
            [os.path.abspath(t) for t in self.test_files], self.start_processing
        )
        folders_logged = []
        for test in self.test_files:
            folder = os.path.dirname(test)
            if folder not in folders_logged:
                folders_logged.append(folder)
                observer.schedule(event_handler, folder, recursive=True)
        observer.start()

    def get_sample(self, sli):
        df = self.slices[sli].data.sample(20)
        df_arrow = pa.Table.from_pandas(df)
        buf = pa.BufferOutputStream()
        with pa.ipc.new_file(buf, df_arrow.schema) as writer:
            writer.write_table(df_arrow)
        return bytes(buf.getvalue())

    def get_metadata_path(self):
        return self.metadata_path

    def get_metrics(self):
        return self.metrics.values()

    def get_results(self):
        return self.results

    def get_slicers(self):
        return self.slicers.values()

    def get_slices(self):
        return self.slices.values()

    def get_slice(self, sli):
        return self.slices[sli]

    def get_status(self):
        return self.status

    def set_status(self, status):
        self.status = status
