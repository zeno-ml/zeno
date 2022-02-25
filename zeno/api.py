import functools
from typing import Tuple, Union


def load_model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.load_model = True
    return _wrapper


def load_data(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.load_data = True
    return _wrapper


def slicer(metrics: Union[str, Tuple[str, str]]):
    """Decorator for slicing functions

    Args:
        metrics: A metric or [tranform, metric] tuple.
    """

    def _decorate(func):
        @functools.wraps(func)
        def _wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        _wrapper.slicer = True
        _wrapper.metrics = metrics
        return _wrapper

    return _decorate


def transform(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.transform = True
    return _wrapper


def metric(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric = True
    return _wrapper
