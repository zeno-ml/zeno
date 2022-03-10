import asyncio
import os
import shelve
import sys
import threading
from importlib import util
from inspect import getmembers, getsource, isfunction, signature
from typing import Callable, Dict, List, Union

import pandas as pd
from watchdog.observers import Observer  # type: ignore

from .util import cached_process, get_arrow_bytes, TestFileUpdateHandler


class Zeno(object):
    def __init__(
        self,
        metadata_path: str,
        test_files: List[str],
        models: List[str],
        batch_size=16,
        id_column="id",
        label_column="label",
        data_path="",
        cache_path="",
    ):
        self.metadata_path = metadata_path
        self.test_files = test_files
        self.model_names = models
        self.batch_size = batch_size
        self.id_column = id_column
        self.label_column = label_column
        self.data_path = data_path
        self.cache_path = cache_path
        os.makedirs(self.cache_path, exist_ok=True)

        self.status: str = "Initializing"

        self.model_loader: Callable
        self.data_loader: Callable

        # Key is name of preprocess function
        self.preprocessors: Dict[str, Preprocessor] = {}
        # Key is name of slicer function
        self.slicers: Dict[str, Slicer] = {}
        # Key is name of transform function
        self.transforms: Dict[str, Transform] = {}
        # Key is name of metric function
        self.metrics: Dict[str, Metric] = {}
        # Key is name of slice
        self.slices: Dict[str, Slice] = {}
        # Key is result.id, hash of properties
        self.results: Dict[int, Result] = {}

        # Read metadata as Pandas for slicing
        self.metadata = pd.read_csv(metadata_path)

        self._loop = None
        self.__initialize_watchdog()

    def __initialize_watchdog(self):
        # Watch for updated test files.

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

    def start_processing(self):
        self.__parse_testing_files()
        self.__run_tests()

    def __parse_testing_files(self):
        model_loader = None
        data_loader = None

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
                        if model_loader is None:
                            model_loader = func
                        else:
                            print("Multiple model loaders found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "load_data"):
                        if data_loader is None:
                            data_loader = func
                        else:
                            print("Multiple data loaders found, can only have one")
                            sys.exit(1)
                    if hasattr(func, "preprocess"):
                        self.preprocessors[func_name] = Preprocessor(func_name, func)
                    if hasattr(func, "slicer"):
                        self.slicers[func_name] = Slicer(func_name, func)
                    if hasattr(func, "transform"):
                        self.transforms[func_name] = Transform(func_name, func)
                    if hasattr(func, "metric"):
                        self.metrics[func_name] = Metric(func_name, func)

        if not model_loader:
            print("ERROR: No model loader found")
            sys.exit(1)
        else:
            self.model_loader = model_loader

        if not data_loader:
            print("ERROR: No data loader found")
            sys.exit(1)
        else:
            self.data_loader = data_loader

    def __run_tests(self):
        if self._loop:
            self._loop.close()
        self._loop = asyncio.new_event_loop()
        threading.Thread(target=self._loop.run_forever, daemon=True).start()
        self._loop.call_soon_threadsafe(asyncio.create_task, self.__run_test_pipeline())

    async def __run_test_pipeline(self):
        self.__preprocess_data()
        self.__slice_data()
        self.__calculate_metrics()

    def __preprocess_data(self):
        for name, preprocess in self.preprocessors.items():
            self.status = "Running preprocessor " + name
            cache = shelve.open(
                os.path.join(
                    self.cache_path,
                    (
                        ".model_preprocess_"
                        + self.metadata_path.replace("/", "_")
                        + name
                    ),
                ),
                writeback=True,
            )
            output = cached_process(
                self.data_loader,
                self.metadata,
                preprocess.func,
                cache,
                self.batch_size,
                self.id_column,
                self.data_path,
            )
            if not isinstance(output, list):
                print("ERROR: preprocess function must return a list")
                sys.exit(1)
            self.metadata[name] = output
        self.status = "Done preprocessing"

    def __slice_data(self):
        self.slices = {}

        for name, slicer in self.slicers.items():
            self.status = "Slicing data for " + name
            self.slices = {
                **self.slices,
                **slicer.slice_data(self.metadata, self.label_column),
            }
        self.status = "Done slicing"

    def __calculate_metrics(self):
        results_cache = self.__open_cache(
            ".results_" + os.path.basename(self.metadata_path)
        )

        self.results = {}
        for i, model_name in enumerate(self.model_names):
            self.status = "Loading model {0}, {1}/{2}".format(
                model_name, str(i + 1), str(len(self.model_names))
            )

            model = self.model_loader(model_name)
            model_cache = self.__open_cache(".model_" + os.path.basename(model_name))

            for j, sli in enumerate(self.slices.values()):
                for k, metric in enumerate(sli.metrics):

                    transform = None
                    if type(metric) in (list, tuple):
                        transform = self.transforms[metric[0]]
                        metric = metric[1]
                    if transform is not None:
                        transform_name = transform.name
                    else:
                        transform_name = ""

                    self.status = (
                        "Model {0}/{1}: Slice {2}/{3} ({4}),"
                        + " test {5}/{6} ({7}), {8} instances"
                    ).format(
                        str(i + 1),
                        str(len(self.model_names)),
                        str(j + 1),
                        str(len(self.slices.items())),
                        sli.name,
                        str(k + 1),
                        str(len(sli.metrics)),
                        metric,
                        str(sli.size),
                    )

                    if i == 0:
                        res = Result(sli.name, transform_name, metric, sli.size)
                    else:
                        res = self.results[
                            int(hash(sli.name + transform_name + metric) / 10000)
                        ]

                    metric_func = self.metrics[metric].func

                    if str(hash(res)) + model_name in results_cache:
                        res.set_result(
                            model_name,
                            results_cache[str(hash(res)) + model_name],  # type: ignore
                        )
                    else:
                        out = cached_process(
                            self.data_loader,
                            self.metadata.iloc[sli.sliced_indices],
                            model,
                            model_cache,
                            self.batch_size,
                            self.id_column,
                            self.data_path,
                        )

                        # TODO: figure out how to cache transform outputs.
                        # if transform is not None:
                        #     t_data, t_metadata = transform.transform(  # type: ignore
                        #         self.__get_data(sli.sliced_indices),
                        #         self.__get_metadata(sli.sliced_indices),
                        #     )
                        #     out_t = cached_model(
                        #         t_data,
                        #         t_metadata[self.id_column].to_list(),
                        #         cache,
                        #         self.loaded_models[model_name],
                        #         self.batch_size,
                        #     )
                        #     if len(signature(metric_func).parameters) == 3:
                        #         result = metric_func(
                        #             out_t, t_metadata, self.label_column
                        #         )
                        #     else:
                        #         result = metric_func(out_t, t_metadata)
                        # else:

                        if len(signature(metric_func).parameters) == 3:
                            result = metric_func(
                                out,
                                self.metadata.iloc[sli.sliced_indices],
                                self.label_column,
                            )
                        else:
                            result = metric_func(
                                out,
                                self.metadata.iloc[sli.sliced_indices],
                            )

                        res.set_result(model_name, out, result)
                        self.results[res.id] = res
                        results_cache[str(hash(res)) + model_name] = result
            model_cache.close()
        results_cache.close()
        self.status = "Done"

    def get_table(self, sli):
        df = self.metadata.iloc[self.slices[sli].sliced_indices]
        return get_arrow_bytes(df)

    def get_model_outputs(self, opts):
        res, model_hash = opts
        # TODO: figure out hash issue, truncates on frontend
        result = self.results[int(res)]
        return {
            "metric": result.model_metric_outputs[int(model_hash)],
            "output": result.model_outputs[int(model_hash)],
        }

    def get_metadata_path(self):
        return self.metadata_path

    def get_metrics(self):
        return self.metrics.values()

    def get_results(self):
        return self.results.values()

    def get_slicers(self):
        return self.slicers.values()

    def get_slices(self):
        return self.slices.values()

    def get_slice(self, sli):
        return self.slices[sli]

    def get_status(self):
        return self.status

    def __open_cache(self, name):
        return shelve.open(
            os.path.join(self.cache_path, name),
            writeback=True,
        )


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

    def slice_data(self, metadata: pd.DataFrame, label_column: str):
        if len(signature(self.func).parameters) == 2:
            slicer_output = self.func(metadata, label_column)
        else:
            slicer_output = self.func(metadata)

        if not isinstance(slicer_output, list):
            slicer_output = slicer_output.to_list()

        slices_to_return = {}
        # Can either be of the from [index list] or [(name, index list)..]
        if (
            len(slicer_output) > 0
            and isinstance(slicer_output[0], tuple)
            or isinstance(slicer_output[0], list)
        ):
            for output_slice in slicer_output:
                indices = list(output_slice[1])
                # Join slice names with backslash
                name = ".".join([self.name, output_slice[0]])
                self.slices.append(name)
                slices_to_return[name] = Slice(
                    name,
                    indices,
                    len(indices),
                    self.metrics,
                    self.name,
                )
        else:
            self.slices.append(self.name)
            slices_to_return[self.name] = Slice(
                self.name,
                slicer_output,
                len(slicer_output),
                self.metrics,
                self.name,
            )

        return slices_to_return


class Preprocessor:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Slice:
    def __init__(
        self,
        name: str,
        sliced_indices: List[int],
        size: int,
        metrics: List[str],
        slicer: str,
    ):
        self.name = name
        self.sliced_indices = sliced_indices
        self.size = size
        self.metrics = metrics
        self.slicer = slicer

    def get_name(self):
        return self.name


class Metric:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Transform:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Result:
    def __init__(self, sli: str, transform: str, metric: str, slice_size: int):
        self.sli = sli
        self.transform = transform
        self.metric = metric
        self.slice_size = slice_size

        self.model_names: List[str] = []

        # Keys are hash of model name
        self.model_outputs: Dict[int, list] = {}
        self.model_results: Dict[int, float] = {}
        self.model_metric_outputs: Dict[int, list] = {}

        self.id: int = int(hash(self.sli + self.transform + self.metric) / 10000)

    def set_result(self, model: str, outputs: list, result: Union[pd.Series, list]):
        self.model_names.append(model)

        model_hash = int(hash(model) / 10000)
        self.model_outputs[model_hash] = outputs
        if isinstance(result, pd.Series):
            self.model_metric_outputs[model_hash] = result.astype(int).to_list()
        elif len(result) > 0 and isinstance(result[0], bool):
            self.model_metric_outputs[model_hash] = [
                1 if r is True else 0 for r in result
            ]

        self.model_results[model_hash] = (
            sum(self.model_metric_outputs[model_hash])
            / len(self.model_metric_outputs[model_hash])
            * 100
        )

    def __str__(self):
        return "Test {0} for slice {1}, transform {2}, size {3}".format(
            self.metric, self.sli, self.transform, self.slice_size
        )

    def __hash__(self):
        return self.id
