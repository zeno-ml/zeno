from dataclasses import dataclass
import functools


@dataclass
class ZenoOptions:
    id_column: str
    data_column: str
    label_column: str
    output_column: str
    data_type: str
    output_type: str
    data_path: str
    output_path: str


def load_model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.load_model = True
    return _wrapper


def preprocess(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.preprocess = True
    return _wrapper


def postprocess(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.preprocess = True
    return _wrapper


def metric(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.metric = True
    return _wrapper
