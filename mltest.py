#!/usr/bin/env python3

import argparse
import functools
import shelve
import sys
from importlib import import_module
from inspect import getmembers, isfunction

import pandas as pd

parser = argparse.ArgumentParser()
parser.add_argument('tests', metavar='tests', nargs='+',
                    help='test files')
parser.add_argument('--data', help='Folder with data instances')
parser.add_argument('--out', help='Name for output file')


def mlmodel(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.mlmodel = True
    return _wrapper


def mlslicer(tests):
    def _decorate(func):
        @functools.wraps(func)
        def _wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        _wrapper.mlslicer = True
        _wrapper.tests = tests
        return _wrapper

    return _decorate


def mltest(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.mltest = True
    return _wrapper


def cache_builder(pred, cache):
    def cacher(inst):
        if cache.get(inst):
            return cache.get(inst)
        else:
            cache[inst] = pred(inst)
            return cache.get(inst)
    return cacher


if __name__ == "__main__":
    args = parser.parse_args()

    if args.data:
        df = pd.read_csv(args.data)
    else:
        print("No data file provided")
        sys.exit(1)

    # Find all model functions in given modules
    model_fns = []
    for mod in args.tests:
        out = import_module(mod)
        model_fns = model_fns + [f[1] for f in getmembers(out) if isfunction(
            f[1]) and hasattr(f[1], "mlmodel")]

    model_caches = {}
    # Create cache files for models
    for model in model_fns:
        model_caches[model] = shelve.open(
            '.' + model.__name__ + ".cache")

    # Find all slicing functions in given modules
    slice_fns = []
    for mod in args.tests:
        out = import_module(mod)
        slice_fns = slice_fns + [f[1] for f in getmembers(out) if isfunction(
            f[1]) and hasattr(f[1], "mlslicer")]

    # Run all slicing functions on data
    slices = []
    for sli in slice_fns:
        sliced_out = sli(df)
        if type(sliced_out) == list:
            for slicer in sliced_out:
                slices.append({
                    "name": "/".join([sli.__name__, slicer[0]]),
                    "data": slicer[1],
                    "size": slicer[1].shape[0],
                    "tests": sli.tests}
                )
        else:
            slices.append({
                "name": sli.__name__,
                "data": sliced_out,
                "size": sliced_out.shape[0],
                "tests": sli.tests
            })

    # Find all testing functions in given modules
    test_fns = {}
    for module in args.tests:
        test_module = import_module(module)
        for func in getmembers(test_module):
            if isfunction(func[1]) and hasattr(func[1], "mltest"):
                test_fns[func[0]] = func[1]

    # Run all testing functions on slices
    results = []
    for sli in slices:
        for test in sli['tests']:
            results.append({
                "test": test,
                "slice": sli['name'],
                "size": sli["size"],
            })
            for model in model_fns:
                results[-1]["model_" + model.__name__] = test_fns[test](
                    sli["data"], cache_builder(model, model_caches[model]))

    for model in model_fns:
        model_caches[model].close()

    for r in results:
        print(r)

    output = pd.DataFrame(results)
    output.to_json(args.out, orient='records')
