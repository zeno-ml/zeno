(writing_tests)=

# Python API

Zeno has 3 primary decorator functions: `predict_function`, `distill_function` and `metric_function`.

You can pass any number of files with decorated functions to Zeno, but you **must have one and only one `predict_function`**.

```{tableofcontents}

```

## Options

Every Zeno test module is passed a ZenoOptions object with the following parameters:

```{eval-rst}
.. automodule:: zeno
   :members:
```

## Predict

`predict_function` functions should return a function that returns a list of model outputs for a given model name.

The function returned by `predict_function` should take two parameters: a Pandas DataFrame and a ZenoOptions object.

```python
@predict_function
def predict_function(model_path: Path) -> Callable[[df: DataFrame, ops: ZenoOptions], Any[]]
```

Example:

```python
@predict_function
def predict_function(model_path):
    model = load_model(model_path)
    def pred(df: DataFrame, ops: ZenoOptions):
        outputs = model(instances)
        return model(df[ops.data_column])
    return pred
```

See [Predict Functions](predict_functions) for real-world examples.

## Distill

`distill` functions return a derived metadata column from input data and/or model outputs.

```python
@distill_function
def distill(df: pd.DataFrame, ops: ZenoOptions) -> Union[pd.Series, List]:
```

Example:

```python
@distill
def get_objects(df, ops):
    return [ObjectDetector(inst) for inst in data[ops.data_column]]
```

See [Distill Functions](distill_functions) for real-world examples.

## Metric

Functions with the `metric` decorator return a continuous number given a subset of data.
Metrics can be classic functions such as accuracy, or specific measures such as word prevalence.

```python
@metric_function
def metric_func(df: pd.DataFrame, ops: ZenoOptions) -> float:
```

Example:

```python
@metric
def accuracy(df, ops):
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)
```

See [Metric Functions](metric_functions) for real-world examples.
