from ..classes import to_camel


def test_camel():
    assert to_camel("foo_bar") == "fooBar"
