(writing_tests)=

# Writing Tests

The Zeno API has 5 decorator functions: two for loading data and models, and three for defining tests.

You can pass any number of files with decorated functions to Zeno, but you **must have one and only one of both the load_model and load_data function**.
You may have as many of the testing functions as you may like.

## Loading Functions

There are two functions for describing how Zeno should run models and load data.

### Load Model

Functions with the `load_model` decorator should return a function that takes a list of data in the format returned by `load_data` and returns a list of outputs used by `metric` functions.

```python
@load_model
def load_model(model_path: str) -> Callable
```

Example:

```python
@load_model
def load_model(model_path):
    return lambda data: model.predict(data)
```

See [Model Loaders](model_loaders) for real-world examples.

### Load Data

Functions with the `load_data` decorator should return a list of data instances, e.g. images or text strings, that are passed to the function returned from `load_model`.
`id_col` is a parameter passed to the zeno command specifying the column with instance paths in the `data_path` folder, e.g. `data/train/0.jpg` in `images/`.

```python
@load_data
def load_data(metadata: DataFrame, id_col: str, data_path: str) -> List[Any]
```

Example:

```python
@load_data
def load_data(df_metadata, id_col, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata[id_col]]
```

See [Data Loaders](data_loaders) for real-world examples.

## Testing Functions

The two core functions for writing tests are `slicer` and `metric` functions.
`slicer` functions return subsets of data for which certain `metric` functions should be calculated.

### Slicer

Functions with the `slicer` decorator return a subset of data.
The subset can be created either from the raw data or metdata DataFrame.
The parameters to the decorator should either be the name of a metric or a tuple specifying a transform function and metric function.

```python
# A list of metric functions or (transform function, metric function) tuples.
@slicer(["Metric 1", ("Transform 1", "Metric 1"), "Metric 2"])
def slicing_func(data: List[Any], metadata: DataFrame) -> List[int]:
```

Example:

```python
@slicer(["accuracy", "false_positive", ("rotate", "accuracy")])
def small_sample(data, metadata):
    return metadata.sample(n=10)

@slicer(["accuracy", ("brighten", "switch_percentage")])
def dark_images(data, metadata):
    return [img for img in data if img.brightness() < 0.1]
```

See [Slicers](slicers) for real-world examples.

### Transform

Functions with the `transform` decorator take a list of instances and return transformed data and metadata.

```python
@transform
def transform(data: List[T], metadata: DataFrame) -> List[T], DataFrame:
```

Example:

```python
@transform
def rotate(images):
    return [img.rotate(90) for img in images]
```

See [Transforms](transforms) for real-world examples.

### Metric

Functions with the `metric` decorator return a float between 0 and 1.
Metrics can be classic functions such as accuracy, or specific measures such as switch percentage or word prevalence.
Optionally, metric functions can take the original output and metadata for instances that had a transformation applied to calculate metrics such as switch percentage.

```python
@metric
def metric_func(output: List[Any], metadata: DataFrame) -> float:

@metric
def metric_func(output: List[Any], metadata: DataFrame, orig_output: List[Any]) -> float:

@metric
def metric_func(output: List[Any], metadata: DataFrame, orig_output: List[Any], orig_metadata: DataFrame) -> float:
```

Example:

```python
@metric
def accuracy(output, metadata):
    return metadata[metadata["label"] == output].shape[0] / (metadata.shape[0])

@metric
def switch_percentage(output, metadata, orig_output):
    return (output != orig_output).sum() / metadata.shape[0]
```

See [Metrics](metrics) for real-world examples.
