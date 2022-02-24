#!/usr/bin/env python

from distutils.core import setup

setup(
    name="zeno",
    version="0.0.1",
    description="Behavioral testing for AI/ML.",
    author="Ángel Alexander Cabrera",
    author_email="alex.cabrera@gmail.com",
    url="https://github.com/cabreraalex/zeno",
    install_requires=[
        # TODO: fill this out
        "pandas",
    ],
    entry_points={
        "console_scripts": ["zeno=zeno.runner:main"],
    },
    packages=["zeno"],
)
