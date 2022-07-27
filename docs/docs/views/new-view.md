# Creating a view

If your data type or task is not supported by an existing View, you can author a new one.
A View at its core is a function that takes state parameters and returns a DOM element to render.
The View is packaged as a Python PyPI package that can be installed and passed to Zeno.

To create a new View you can use the [Svelte](https://svelte.dev/) cookiecutter template:

```bash
pip install cookiecutter
git clone https://github.com/cmudig/zeno
cookiecutter zeno/views/template
```

This will create a simple Python package and Svelte project for creating a new view.
In the `frontend/src/Component.svelte` file you can find a scaffolded component that takes all the available parameters such as data paths and the current table.
