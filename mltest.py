import functools


def load_model(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.loader = True
    return _wrapper


def predictor(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.predictor = True
    return _wrapper


def slicer(tests):
    def _decorate(func):
        @functools.wraps(func)
        def _wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        _wrapper.slicer = True
        _wrapper.tests = tests
        return _wrapper

    return _decorate


def tester(func):
    @functools.wraps(func)
    def _wrapper(*args, **kwargs):
        return func(*args, **kwargs)

    _wrapper.tester = True
    return _wrapper
