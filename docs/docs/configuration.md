---
sidebar_position: 3
---

# Configuration file

Zeno options are set using a `TOML` file such as the following:

```toml
tests = "./tests/"
view = "zenoml-image-classification"
metadata = "./metadata.csv"
models = [
	"./cifar_net_2.pth",
	"./cifar_net_5.pth",
	"./cifar_net_10.pth",
	"./cifar_net_20.pth"
]
data_path = "./data/"
data_column = "id"
data_type = "path"
```

## Configuration options

The configuration file has the the following options.

### `tests`

Path to a directory with Python files defining Zeno modules. **Required**

### `metadata`

Path to a `csv` or `parquet` file with metadata for data instances. **Required**

Must have a column with unique identifiers for each instance that corresponds with their filename relative to `data_path`.

### `task`

The type of model being analyzed. **Required**

One of the following:

- `image-classification`
- `image-segmentation`
- `object-detection`
- `text-classification`
- `audio-classification`

### `models`

List of models to test. **Required**

Can either be paths or names, passed directly to the `load_model` function.

---

### `data_path`

The directory with data instances. **Optional**

### `label_path`

The directory with label files. **Optional**

### `id_column`

The column with unique identifiers in the metadata file. **Optional**

By default it is `id`.

### `data_column`

The column with either file names for data instances or raw data (e.g. text). **Optional**

By default it is `id`.

### `label_column`

The column with either file names for data instances or raw data (e.g. text). **Optional**

By default it is `label`.

### `port`

The port to run Zeno on. **Optional**

### `batch_size`

The batch size used when running inference. **Optional**

### `cache_path`

Where cache outputs are stored. **Optional**

By default it is `.zeno_cache` in the same directory as the `TOML` file. Cache stores preprocesssing and model outputs.
