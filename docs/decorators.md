(writing_tests)=

# Writing Tests

The Zeno API has 4 decorator functions: one for loading models and three for defining tests.

You can pass any number of files with decorated functions to Zeno, but you **must have one and only one `load_model` function**.
You may have as many of the testing functions as you may like.

```{tableofcontents}

```

## Options

Every Zeno test module is passed a ZenoOptions object with the following parameters:

```{eval-rst}
.. automodule:: zeno
   :members:
```

## Load Model

Functions with the `load_model` decorator should return a function that takes a list of data in the format returned by `load_data` and returns a list of outputs used by `metric` functions.

```python
@load_model
def load_model(model_path: Path) -> Callable[Any[], Any[]]
```

Example:

```python
@load_model
def load_model(model_path):
    """We return a new function to be able to process the output of the model correctly"""
    model = load_model(model_path)
    def pred(instances):
        outputs = model(instances)
        processed = process(outputs)
        return processed
    return model
```

See [Model Loaders](model_loaders) for real-world examples.

## Preprocess

Functions with the `preprocess` decorator return a new column derived from the original data and metadata.
It can be used to extract metadata from an instance

```python
@preprocess
def preprocessor(df: pd.DataFrame, ops: ZenoOptions) -> Union[pd.Series, List]:
```

Example:

```python
@preprocess
def get_objects(df, ops):
    return [ObjectDetector(inst) for inst in data[ops.data_column]]
```

See [Preprocessors](preprocessors) for real-world examples.

## Postprocess

Functions with the `postprocess` decorator return a new column derived from the original data, metadata, and _a given model's output_.

```python
@postprocess
def postprocessor(df: pd.DataFrame, ops: ZenoOptions) -> Union[pd.Series, List]:
```

Example:

```python
@postprocess
def get_objects(df, ops):
    return [ObjectDetector(inst) for inst in data[ops.data_column]]
```

See [Postprocessors](postprocessors) for real-world examples.

## Metric

Functions with the `metric` decorator return a float between 0 and 1.
Metrics can be classic functions such as accuracy, or specific measures such as switch percentage or word prevalence.
Optionally, metric functions can take the original output and metadata for instances that had a transformation applied to calculate metrics such as switch percentage.

```python
@metric
def metric_func(df: pd.DataFrame, ops: ZenoOptions) -> Union[int, float]:
```

Example:

```python
@metric
def accuracy(df, ops):
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)
```

See [Metrics](metrics) for real-world examples.
