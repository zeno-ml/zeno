# Zeno Views

A core component of Zeno are modular _views_ that can display different types of data.
Views are JavaScript functions that take a set of state variables and return a rendered DIV element.
While the standard cookiecutter is set up to write views using Svelte, any frontend framework can be used.

To create a new view, use the Python _cookiecutter_ library:

`cookiecutter ./template`

Follow the instructions to build the frontend, and add the component to the development build of zeno:

`poetry add ./views/my_custom_view`
