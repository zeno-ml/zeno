<img src="./zeno.png" width="400px"/>

![Github Actions CI tests](https://github.com/cabreraalex/zeno/actions/workflows/test.yml/badge.svg)
![Github Actions Docs build](https://github.com/cabreraalex/zeno/actions/workflows/book.yml/badge.svg)
[![codecov](https://codecov.io/gh/cmudig/zeno/branch/main/graph/badge.svg?token=7x5oegcwfn)](https://codecov.io/gh/cmudig/zeno)
[![code style black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## Install

Install the Zeno package from PyPI:

```
pip install zenoml
```

### [Follow the documentation to get started](https://dig.cmu.edu/zeno/intro.html)

## Development Quick Start + CIFAR-10 Example

After cloning the repository:

- Install [`Poetry`](https://python-poetry.org/docs/master/#installing-with-the-official-installer), [`nodejs`](https://nodejs.org/en/download/) and use [`VSCode`](https://code.visualstudio.com/) as your editor.
- `make install`

You should now be able to run `poetry run zeno`

To run the CIFAR-10 example:

- `mkdir data; cd data; git clone https://github.com/YoongiKim/CIFAR-10-images`
- `poetry run zeno examples/cifar/tests/zeno.toml`
- For debugging, you can use the "Run and Debug" sidebar in VSCode (a play button with a bug icon), and run the `zenocifar` configuration.

To see live changes to the frontend:

- `cd frontend; npm run dev`
