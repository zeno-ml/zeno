# Decorator Functions

## Testing Functions

The two core functions for writing tests are `slicer` and `metric` functions.
`slicer` functions return subsets of data for which certain `metric` functions should be calculated.

**Slicer**

Functions with the `slicer` decorator return a subset of data.
The subset can be created either from the raw data or metdata DataFrame.

```python
# A list of metric functions or (transform function, metric function) tuples.
@slicer(["Metric 1", ("Transform 1", "Metric 1"), "Metric 2"])
def slicing_func(data: List[Any], metadata: DataFrame) -> List[int]:
```

Examples:

```python
@slicer(["accuracy", "false_positive", ("rotate", "accuracy")])
def small_sample(data, metadata):
    return metadata.sample(n=10)

@slicer(["accuracy", ("brighten", "switch_percentage")])
def dark_images(data, metadata):
    return [img for img in data if img.brightness() < 0.1]
```

**Transform**

Functions with the `transform` decorator return a list of transformed data.

```python
@transform
def transform(data: List[T], metadata: DataFrame) -> List[T], DataFrame:
```

Examples:

```python
@transform
def rotate(images):
    return [img.rotate(90) for img in images]
```

**Metric**

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

Examples:

```python
@metric
def accuracy(output, metadata):
    return metadata[metadata["label"] == output].shape[0] / (metadata.shape[0])

@metric
def switch_percentage(output, metadata, orig_output):
    return (output != orig_output).sum() / metadata.shape[0]
```

## Loading Functions

There are two additional functions for describing how Zeno should run models and load data.

**Load Model**

Functions with the `load_model` decorator should return a function that takes a list of data in the format returned by `load_data` and returns a list of outputs.

```python
@load_model
def load_model(model_path: str) -> Callable
```

Examples:

```python
@load_model
def load_model(model_path):
    return lambda data: model.predict(data)
```

**Load Data**

Functions with the `load_data` decorator should return a list of data instances, e.g. images or text strings, that can be predicted by the function returned from `load_model`.
To get the column with ID labels, use `metadata.index`.

```python
@load_data
def load_data(metadata: DataFrame, data_path: str) -> List[Any]
```

Examples:

```python
@load_data
def load_data(df_metadata, id_col, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata[id_col]]
```
