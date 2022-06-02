(api)=

# Running Tests

Zeno options are set using a `TOML` file:

```
zeno zeno_config.toml
```

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

### `port`

The port to run Zeno on. **Optional**

### `batch_size`

The batch size used when running inference. **Optional**

### `id_column`

The column with unique identifiers in the metadata file. **Optional**

By default it is `id`.

### `id_column`

The column with ground truth labels in the metadata file. **Optional**

By default it is `label`.

### `cache_path`

Where cache outputs are stored. **Optional**

By default it is `.zeno_cache` in the same directory as the `TOML` file. Cache stores preprocesssing and model outputs.
