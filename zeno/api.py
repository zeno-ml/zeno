import functools


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


def preprocess(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.preprocess = True
    return _wrapper


def slicer(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.slicer = True
    return _wrapper


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
