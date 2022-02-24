# Zeno - Behavioral testing of AI/ML ![example workflow](https://github.com/cabreraalex/zeno/actions/workflows/zeno-ci.yml/badge.svg)

## Development

### Environment

Please install [`Poetry`](https://python-poetry.org/docs/master/#installing-with-the-official-installer) and use VSCode as your editor.

### Install

`poetry install`

### Running

`poetry run zeno`

### Linting

`poetry run flake8 zeno/`

### Testing

`poetry run pytest tests/`

### Docs

`make html`

`sphinx-autobuild docs docs/_build/html`

### Deployment

Create a bundled package with:

`poetry build`
