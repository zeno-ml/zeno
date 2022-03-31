(writing_tests)=

# Writing Tests

The Zeno API has 5 decorator functions: two for loading data and models, and three for defining tests.

You can pass any number of files with decorated functions to Zeno, but you **must have one and only one of both the load_model and load_data function**.
You may have as many of the testing functions as you may like.

```{tableofcontents}

```

## Loading Functions

There are two functions for describing how Zeno should run models and load data.

### Load Model

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

### Load Data

Functions with the `load_data` decorator should return a list of data instances, e.g. images or text strings, that are passed to the function returned from `load_model`.
Use the index of the dataframe, e.g. `metadata.index` to get the column with instance paths in the `data_path` folder, e.g. `data/train/0.jpg` in `images/`.

```python
@load_data
def load_data(metadata: DataFrame, data_path: str) -> List[Any]
```

Example:

```python
@load_data
def load_data(df_metadata, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata.index]
```

See [Data Loaders](data_loaders) for real-world examples.

## Testing Functions

The four core functions for writing tests are `preprocess`, `slicer`, `transform` and `metric`.
`preprocess` runs a function, e.g. extracting metadata, on each instance.
The `slicer` function return subsets of data for which certain `metric` functions should be calculated.
An optional `transform` function can be provided to modify instances before they are passed to the `metric` functions.

### Preprocess

Functions with the `preprocess` decorator return a new column derived from the original data and metadata.
It can be used to extract metadata from an instance

```python
@preprocess
def preprocessor(data: List[Any]) -> Union[pd.Series, List]:
```

Example:

```python
@preprocess
def get_objects(data, metadata):
    return [ObjectDetector(inst) for inst in data]
```

See [Preprocessors](preprocessors) for real-world examples.

### Slicer

Functions with the `slicer` decorator return a subset of data derived form metadata values.
The parameters to the decorator should either be the name of a metric or a tuple specifying a transform function and metric function.
The function should return either a list of indices or the sliced DataFrame.

```python
@slicer
def slicing_func(metadata: DataFrame) -> Union[pd.DataFrame, pd.Index]:
```

Example:

```python
@slicer
def small_sample(metadata):
    return metadata.sample(n=10).index
```

See [Slicers](slicers) for real-world examples.

### Transform

Functions with the `transform` decorator take a list of instances and return transformed data.

```python
@transform
def transform(data: List[T]) -> List[T]:
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
def metric_func(output: List[Any], metadata: DataFrame, label_col: str) -> Union[pd.DataFrame, pd.Index, List[Any]]:
```

Example:

```python
@metric
def accuracy(output, metadata, label_col):
    return metadata[metadata[label_col] == output]]
```

See [Metrics](metrics) for real-world examples.
