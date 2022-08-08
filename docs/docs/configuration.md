---
sidebar_position: 3
---

# Configuration file

Zeno options are set using a `TOML` file such as the following:

```toml title="Example TOML configuration for an image classification task"
tests = "./tests/"
view = "zenoml-image-classification"
metadata = "./metadata.csv"
models = [
	"./model_epochs_2.pth",
	"./model_epochs_5.pth",
	"./model_epochs_10.pth",
	"./model_epochs_20.pth"
]
data_path = "./data/"
data_column = "id"
data_type = "path"
```

Which is used to run zeno with `zeno config.toml`.

## Configuration options

The configuration file has the the following options.

### `view`

The Zeno View used for the given data and task, e.g. `zenoml-image-classification`. **Required**

See [Instance views](/docs/views) for a list of available views.

### `tests`

Path to a directory with Python files implementing Zeno functions. **Required**

### `metadata`

Path to a `csv` or `parquet` file with metadata for data instances. **Required**

Must have a column with unique identifiers for each instance, specificed by [`id_column`](/docs/configuration#id_column).

### `models`

List of models to test. **Required**

Can either be paths or strings which are passed directly to the [`load_model`](/docs/api#Predict) function.

---

### `id_column`

The column with unique identifiers in the metadata file. **Optional**

By default it is `id`.

### `data_column`

The column with either file names for data instances or raw data (e.g. text). **Optional**

By default it is `id`.

### `label_column`

The column with either file names for data instances or raw data (e.g. text). **Optional**

By default it is `label`.

### `data_path`

The directory with data instances. **Optional**

### `label_path`

The directory with label files. **Optional**

### `batch_size`

The batch size used when running inference. **Optional**

### `cache_path`

Where cache outputs are stored. **Optional**

By default it is `.zeno_cache` in the same directory as the `TOML` file. Cache stores preprocesssing and model outputs.

### `samples`

Number of samples to show by default in view. Default 30. **Optional**

### `port`

The port to run Zeno on. **Optional**
