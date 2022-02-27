# Zeno - Behavioral testing of AI/ML ![example workflow](https://github.com/cabreraalex/zeno/actions/workflows/test.yml/badge.svg)

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

### Build and Deploy

`make build`
