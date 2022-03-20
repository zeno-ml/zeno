import asyncio
import os
import shelve
import sys
import threading
from importlib import util
from inspect import getmembers, getsource, isfunction, signature
from pathlib import Path
from typing import Callable, Dict, List, Tuple, Union

import pandas as pd
from watchdog.observers import Observer  # type: ignore

from .util import cached_process, get_arrow_bytes, TestFileUpdateHandler


class Zeno(object):
    def __init__(
        self,
        metadata_path: Path,
        test_files: List[Path],
        models: List[Path],
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

        self.model_loader: Callable = None  # type: ignore
        self.data_loader: Callable = None  # type: ignore

        # Key is name of preprocess function
        self.preprocessors: List[Preprocessor] = []
        # Key is name of slicer function
        self.slicers: Dict[str, Slicer] = {}
        # Key is name of transform function
        self.transforms: Dict[str, Callable] = {}
        # Key is name of metric function
        self.metrics: Dict[str, Callable] = {}
        # Key is name of slice
        self.slices: Dict[str, Slice] = {}
        # Key is result.id, hash of properties
        self.results: Dict[int, Result] = {}

        self._loop = None
        self.__initialize_watchdog()

        # Read metadata as Pandas for slicing
        if metadata_path.suffix == ".csv":
            self.metadata = pd.read_csv(metadata_path)
        elif metadata_path.suffix == ".parquet":
            self.metadata = pd.read_parquet(metadata_path)
        else:
            print(
                "ERROR: extension of "
                + metadata_path.suffix
                + " not one of .csv or .parquet"
            )

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

    def start_processing(self):
        self.__parse_testing_files()
        self.__run_tests()

    def __parse_testing_files(self):
        self.data_loader = None  # type: ignore
        self.model_loader = None  # type: ignore
        self.slicers = {}
        self.metrics = {}
        self.transforms = {}

        for test_file in self.test_files:
            if test_file.is_dir():
                [
                    self.__parse_testing_file(f, test_file)
                    for f in list(test_file.rglob("*.py"))
                ]
            else:
                self.__parse_testing_file(test_file, test_file.parents[0])

        if not self.model_loader:
            print("ERROR: No model loader found")
            sys.exit(1)

        if not self.data_loader:
            print("ERROR: No data loader found")
            sys.exit(1)

    def __parse_testing_file(self, test_file: Path, base_path: Path):
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
                if hasattr(func, "preprocess"):
                    self.preprocessors.append(Preprocessor(func_name, func))
                if hasattr(func, "slicer"):
                    path_names = list(test_file.relative_to(base_path).parts)
                    path_names[-1] = path_names[-1][0:-3]
                    self.slicers[func_name] = Slicer(
                        func_name,
                        func,
                        [*path_names, func_name],
                    )
                if hasattr(func, "transform"):
                    self.transforms[func_name] = func
                if hasattr(func, "metric"):
                    self.metrics[func_name] = func

    def __run_tests(self):
        if self._loop:
            self._loop.stop()
        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(target=self._loop.run_forever, daemon=True)
        self._thread.start()
        self._loop.call_soon_threadsafe(asyncio.create_task, self.__run_test_pipeline())

    async def __run_test_pipeline(self):
        self.__preprocess_data()
        self.__slice_data()
        self.__calculate_metrics()

    def __preprocess_data(self):
        for preprocessor in self.preprocessors:
            self.status = "Running preprocessor " + preprocessor.name
            cache = shelve.open(
                os.path.join(
                    self.cache_path,
                    (
                        ".model_preprocess_"
                        + str(self.metadata_path).replace("/", "_")
                        + preprocessor.name
                    ),
                ),
                writeback=True,
            )
            output = cached_process(
                self.data_loader,
                self.metadata,
                preprocessor.func,
                cache,
                self.batch_size,
                self.id_column,
                self.data_path,
            )
            if not isinstance(output, list):
                print("ERROR: preprocess function must return a list")
                sys.exit(1)
            self.metadata[preprocessor.name] = output
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
                    transform_name = ""
                    if type(metric) in (list, tuple):
                        transform = self.transforms[metric[0]]
                        transform_name = transform.__name__
                        metric = metric[1]

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
                        res = Result(
                            sli.name,
                            transform_name,
                            metric,
                            sli.size,
                            self.model_names,
                        )
                    else:
                        res = self.results[
                            int(
                                hash("".join(sli.name) + transform_name + metric)
                                / 10000
                            )
                        ]

                    metric_func = self.metrics[metric]

                    out = cached_process(
                        self.data_loader,
                        self.metadata.iloc[sli.sliced_indices],
                        model,
                        model_cache,
                        self.batch_size,
                        self.id_column,
                        self.data_path,
                        transform=transform,
                    )

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
            model_cache.close()
        self.status = "Done"

    def get_table(self, sli: str):
        """Get the metadata DataFrame for a given slice.

        Args:
            sli (str): Name of the slice

        Returns:
            bytes: Arrow-encoded table of slice metadata
        """
        df = self.metadata.iloc[self.slices[sli].sliced_indices]
        return get_arrow_bytes(df)

    def get_result(self):
        return {}

    def get_model_outputs(self, opts: Tuple[int, int]):
        """Get outputs for a certain model in a certain result.

        Args:
            opts (Tuple[int, int]): The result and model hash

        Returns:
            Dict: JSON-like item with the metric and output values
        """
        # result_hash, model_hash = opts
        # TODO: figure out hash issue, truncates on frontend
        # result = self.results[int(result_hash)]
        return opts
        # return {
        #     "metric": result.model_metric_outputs[int(model_hash)],
        #     "output": result.model_outputs[int(model_hash)],
        # }

    def __open_cache(self, path: str):
        """Get shelve cache for a path

        Args:
            path (str): Filename for the cache file

        Returns:
            Shelf: Cache dict
        """
        return shelve.open(
            os.path.join(self.cache_path, path),
            writeback=True,
        )


class Slicer:
    def __init__(self, name: str, func: Callable, name_list: List[str]):
        self.name = name
        self.func = func
        self.name_list = name_list

        self.metrics = func.metrics  # type: ignore
        self.source = getsource(self.func)
        self.slices: List[str] = []

    def slice_data(self, metadata: pd.DataFrame, label_column: str):
        if len(signature(self.func).parameters) == 2:
            slicer_output = self.func(metadata, label_column)
        else:
            slicer_output = self.func(metadata)

        if isinstance(slicer_output, pd.DataFrame):
            slicer_output = slicer_output.index

        slicer_output = list(slicer_output)

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
                name_list = [*self.name_list, output_slice[0]]
                self.slices.append("".join(name_list))
                slices_to_return["".join(name_list)] = Slice(
                    [*self.name_list, output_slice[0]],
                    indices,
                    len(indices),
                    self.metrics,
                    self.name,
                )
        else:
            self.slices.append("".join(self.name_list))
            slices_to_return["".join(self.name_list)] = Slice(
                self.name_list,
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
        name: List[str],
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


class Transform:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Metric:
    def __init__(self, name: str, func: Callable):
        self.name = name
        self.func = func
        self.source = getsource(self.func)


class Result:
    def __init__(
        self,
        sli: List[str],
        transform: str,
        metric: str,
        slice_size: int,
        model_names: List[Path],
    ):
        self.sli = sli
        self.transform = transform
        self.metric = metric
        self.slice_size = slice_size
        self.model_names = model_names

        # Keys are hash of model name
        self.model_outputs: Dict[str, list] = {}
        self.model_results: Dict[str, float] = {}
        self.model_metric_outputs: Dict[str, list] = {}

        self.id: int = int(
            hash("".join(self.sli) + self.transform + self.metric) / 10000
        )

    def set_result(self, model: Path, outputs: list, result: Union[pd.Series, list]):
        model_name = str(model)
        self.model_outputs[model_name] = outputs
        if isinstance(result, pd.Series):
            self.model_metric_outputs[model_name] = result.astype(int).to_list()
        elif len(result) > 0 and isinstance(result[0], bool):
            self.model_metric_outputs[model_name] = [
                1 if r is True else 0 for r in result
            ]

        self.model_results[model_name] = (
            sum(self.model_metric_outputs[model_name])
            / len(self.model_metric_outputs[model_name])
            * 100
        )

    def __hash__(self):
        return self.id
