# Development

## Architecture Overview

Zeno's frontend is a Svelte app (`frontend/`) which is compiled to JS modules and other static assets such as HTML and CSS files (`zeno/frontend/`).

Zeno's backend is a Python FastAPI server (`zeno/server.py` and `zeno/runner.py`) which can be run from the command line program or from computational notebooks.
The FastAPI server hosts the compiled frontend files and the backend API the frontend interfaces with.

For the frontend we used the compiled OpenAPI interface instead of raw `fetch` requests to interact with the backend.
The API can be generated using the `npm run generate-api` command, which creates the `frontend/src/zenoservice` folder.
All the TypeScript classes used in the frontend come from the compiled OpenAPI spec, giving us a single source of truth for classes from Python.

Zeno is packaged as a PyPI package `zenoml` that contains the Python backend files and the compiled frontend.

## Development Installation

After cloning the repository:

- Install [`Poetry`](https://python-poetry.org/docs/master/#installing-with-the-official-installer), [`nodejs`](https://nodejs.org/en/download/) and use [`VSCode`](https://code.visualstudio.com/) as your editor.
- `poetry config virtualenvs.in-project true`
- `make install`

You should now be able to run `poetry run zeno`

To run the CIFAR-10 example:

- `mkdir data; cd data; git clone https://github.com/YoongiKim/CIFAR-10-images`
- `source ./.venv/bin/activate` (Windows OS command: `.\.venv\Scripts\activate`)
- `pip install Pillow torch torchvision`
- `poetry run zeno ./examples/cifar/tests/zeno.toml`
  - For debugging, you can use the "Run and Debug" sidebar in VSCode (a play button with a bug icon), and run the `zenocifar` configuration.

In a different terminal window, run the following command to serve the frontend code:

- `cd frontend; npm run dev`

You should now be able to see a live version of zeno on `localhost:8000` in your browser.

**Windows OS Note**
- If `make` command is not working, install `gnuwin32` following the [`instructions`](https://superuser.com/a/1634350) to make it works.
- If encountering `ModuleNotFoundError: No module named “cifar_model”`, add `zeno/examples/cifar/tests` path to `.venv/Lib/site-packages/zenoml.pth` file.

## Contributing

Pull requests are welcome for any bug fixes or features.
The Zeno project includes a Makefile which runs various linting and typechecks.
Run `make` to ensure your code passes the requirements, as it is the same command used in the GitHub Action to test PRs.

**Please ensure `make` passes before submitting a pull request.**

For commit message and pull request titles, use the [Conventional Commits Standards](https://www.conventionalcommits.org/en/v1.0.0/#summary).

