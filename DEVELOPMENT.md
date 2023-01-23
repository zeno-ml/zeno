# Development

After cloning the repository:

- Install [`Poetry`](https://python-poetry.org/docs/master/#installing-with-the-official-installer), [`nodejs`](https://nodejs.org/en/download/) and use [`VSCode`](https://code.visualstudio.com/) as your editor.
- `poetry config virtualenvs.in-project true`
- `make install`

You should now be able to run `poetry run zeno`

To run the CIFAR-10 example:

- `mkdir data; cd data; git clone https://github.com/YoongiKim/CIFAR-10-images`
- `source ./.venv/bin/activate`
- `pip install Pillow torch torchvision`
- `poetry run zeno ./examples/cifar/tests/zeno.toml`
  -  For debugging, you can use the "Run and Debug" sidebar in VSCode (a play button with a bug icon), and run the `zenocifar` configuration.

In a different terminal window, run the following command to serve the frontend code:

- `cd frontend; npm run dev`

You should now be able to see a live version of zeno on `localhost:8000` in your browser.

## Development Commands

The following make recipes can be used to check properties such as tests and linting. **Please ensure `make` passes before submitting a pull request.**

### All Checks

`make`

### Linting

`make lint`

### Testing

`make test`
