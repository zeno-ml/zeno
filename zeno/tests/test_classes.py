from ..classes import Metric, Preprocessor, Transform


def test_preprocessor():
    p = Preprocessor("a", lambda x: x + 1)
    assert p.name == "a"
    assert p.func(2) == 3


def test_metric():
    p = Metric("a", lambda x: x + 1)
    assert p.name == "a"
    assert p.func(2) == 3


def test_transform():
    p = Transform("a", lambda x: x + 1)
    assert p.name == "a"
    assert p.func(2) == 3
