from ..classes import Metric


def test_metric():
    p = Metric("a", lambda x: x + 1)
    assert p.name == "a"
    assert p.func(2) == 3
