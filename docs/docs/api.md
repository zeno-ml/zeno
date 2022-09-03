---
sidebar_position: 2
---

# Python API

Zeno has 4 primary decorator functions: `model`, `distill`, `metric`, and `transform`.

You can pass any number of files with decorated functions to Zeno, but you **must have one and only one `model`**.

## ZenoOptions

Every Zeno function is passed a ZenoOptions object with the following parameters.
The column values refer to column names in the DataFrame and the paths refer to directories relative to the Zeno configuration file.

```python
@dataclass
class ZenoOptions:
    """Parameters passed to Zeno test functions.

    Args:
        id_column (str): Column in dataframe with unique identifiers.
        data_column (str): Column in dataframe with either raw data or path to data.
        label_column (str): Column in dataframe with
                            either raw labels or path to labels.
        output_column (str): Column in dataframe with a given
                             model's raw output or path to output
        data_path (str): Path to directory with data files.
        label_path (str): Path to directory with label files.
        output_path (str): Path to directory with a given model's output.
        distill_columns (map[str, str]): Map from distiller name to distill column.
    """

    id_column: str
    data_column: str
    label_column: str
    output_column: str
    distill_columns: Dict[str, str]
    data_path: str
    label_path: str
    output_path: str
```

## Predict

`model` functions should return a function that returns a list of model outputs for a given model name.

The function returned by `model` should take two parameters: a Pandas DataFrame and a ZenoOptions object.

```python
@model
def model(model_path: Path) -> Callable[[df: DataFrame, ops: ZenoOptions], Any[]]
```

Example:

```python title="Load mock model and return outputs"
@model
def model(model_path):
    model = load_model(model_path)
    def pred(df: DataFrame, ops: ZenoOptions):
        outputs = model(instances)
        return model(df[ops.data_column])
    return pred
```

## Distill

`distill` functions return a derived metadata column from input data and/or model outputs.

```python
@distill
def distill(df: pd.DataFrame, ops: ZenoOptions) -> Union[pd.Series, List]:
```

Example:

```python title="Get amplitude of sound file"
@distill
def amplitude(df, ops: ZenoOptions):
    files = [os.path.join(ops.data_path, f) for f in df[ops.data_column]]
    amps = []
    for audio in files:
        y, _ = librosa.load(audio)
        amps.append(np.abs(y).mean())
    return amps
```

## Metric

Functions with the `metric` decorator return a continuous number given a subset of data.
Metrics can be classic functions such as accuracy, or specific measures such as word prevalence.

```python
@metric
def metric_func(df: pd.DataFrame, ops: ZenoOptions) -> float:
```

Example:

```python title="Calculate accuracy of model"
@metric
def accuracy(df, ops):
    return 100 * (df[ops.label_column] == df[ops.output_column]).sum() / len(df)
```

## Transform

Functions with the `transform` decorator return a new, transformed instance.

```python
@transform
def metric_func(df: pd.DataFrame, ops: ZenoOptions) -> any:
```

Example:

```python title="Rotate images 90 degrees"
@transform
def rotate(df, ops):
    for img_path in df[ops.data_column]:
        img = Image.open(os.path.join(ops.data_path, img_path))
        rot_img = img.rotate(90)
        rot_img.save(os.path.join(ops.output_path, "".join(img_path.split("/"))))
    return ["".join(x.split("/")) for x in list(df[ops.data_column])]
```
