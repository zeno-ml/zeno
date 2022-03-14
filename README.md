# Zeno - Behavioral testing of AI/ML

![Github Actions CI tests](https://github.com/cabreraalex/zeno/actions/workflows/test.yml/badge.svg)
[![code style black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![codecov](https://codecov.io/gh/cabreraalex/zeno/branch/main/graph/badge.svg?token=XPT8R98H8J)](https://codecov.io/gh/cabreraalex/zeno)

## Quick Start

Install the Zeno package from PyPI:

```
pip install zenoml
```

### [Follow the documentation to get started](https://cabreraalex.github.io/zeno/intro.html)

## Development

### Environment

Please install [`Poetry`](https://python-poetry.org/docs/master/#installing-with-the-official-installer) and use VSCode as your editor.

### Install

Suggest setting poetry to install the virtual env locally, which VSCode can use directly:

`poetry config virtualenvs.in-project true`

`poetry install`

### Running

`poetry run zeno`

### Formatting and Linting

`make`

### Testing

`make test`

### Build Docs

`make book`

### Build

`make build`

### Publish

`make publish`
