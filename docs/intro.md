# Zeno: Behavioral Evaluation Framework for ML

Zeno is a general-purpose framework for evaluating machine learning models.
It combines a **Python API** with an **interactive UI** to allow users to discover, explore, and analyze the performance of their models across diverse use cases.
Zeno can be used for any data type or task with _modular views_ for everything from object detection to audio transcription.

::::{grid}
:gutter: 2

:::{grid-item-card} Python API:

```python
@distill_function
def brightness(df, ops):
    return lum(df[ops.data_column]))

@metric_function
def accuracy(df, ops):
    return df[ops.label_column]
           == df[ops.output_column]
```

:::

:::{grid-item-card} Interactive UI:
![teaser](./teaser.png)
:::
::::

## Quickstart

```bash
pip install zenoml
```

Create a folder with at least one Python file and a `predict_function`.
Add any number of Zeno modules using the `distill` and `metric` functions.
See [Writing Tests](writing_tests) for details on each of these modules.

Next, create a configuration `TOML` file with the required options such as metadata and model file paths. See [API](api) for the configuration options.

Lastly, run Zeno:

```bash
zeno config.toml
```

See [Test Examples](test-examples) for various example tests.

## Table of Contents

```{tableofcontents}

```
