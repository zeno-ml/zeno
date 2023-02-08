<img src="./zeno.png" width="250px"/>

[![PyPI version](https://badge.fury.io/py/zenoml.svg)](https://badge.fury.io/py/zenoml)
![Github Actions CI tests](https://github.com/zeno-ml/zeno/actions/workflows/test.yml/badge.svg)
![Github Actions Docs build](https://github.com/zeno-ml/zenoml.com/actions/workflows/docs.yml/badge.svg)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/) [![Join the chat at https://gitter.im/zeno-ml-eval/community](https://badges.gitter.im/zeno-ml-eval/community.svg)](https://gitter.im/zeno-ml-eval/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Zeno is a general-purpose framework for evaluating machine learning models.
It combines a **Python API** with an **interactive UI** to allow users to discover, explore, and analyze the performance of their models across diverse use cases.
Zeno can be used for any data type or task with [modular views](https://zenoml.com/docs/views/) for everything from object detection to audio transcription.

## Quickstart

Install the Zeno Python package from PyPI:

```bash
pip install zenoml
```

### Command Line

To get started, run the following command to initialize a Zeno project. It will walk you through creating the `zeno.toml` configuration file:

```bash
zeno init
```

Take a look at the [configuration documentation](https://zenoml.com/docs/configuration) for additional `toml` file options like adding model functions.

Start Zeno with `zeno zeno.toml`.

### Jupyter Notebook

You can also run Zeno directly from Jupyter notebooks or lab. The `zeno` command takes a dictionary of configuration options as input. See [the docs](https://zenoml.com/docs/configuration) for a full list of options. In this example we pass the minimum options for exploring a non-tabular dataset:

```python
import pandas as pd
from zeno import zeno

df = pd.read_csv("/path/to/metadata/file.csv")

zeno({
    "metadata": df, # Pandas DataFrame with a row for each instance
    "view": "audio-transcription", # The type of view for this data/task
    "data_path": "/path/to/raw/data/", # The folder with raw data (images, audio, etc.)
    "data_column": "id" # The column in the metadata file that contains the relative paths of files in data_path
})

```

You can pass a list of decorated function references directly Zeno as you add models and metrics.

## Citation

Please reference our [CHI'22 paper](https://cabreraalex.com/zeno.pdf)

```bibtex
@inproceedings{cabrera23zeno,
  author = {Cabrera, Ángel Alexander and Fu, Erica and Bertucci, Donald and Holstein, Kenneth and Talwalkar, Ameet and Hong, Jason I. and Perer, Adam},
  title = {Zeno: An Interactive Framework for Behavioral Evaluation of Machine Learning},
  year = {2023},
  isbn = {978-1-4503-9421-5/23/04},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  url = {https://doi.org/10.1145/3544548.3581268},
  doi = {10.1145/3544548.3581268},
  booktitle = {CHI Conference on Human Factors in Computing Systems},
  location = {Hamburg, Germany},
  series = {CHI '23}
}
```

## Community

Chat with us on our [Gitter channel](https://gitter.im/zeno-ml-eval/community) or leave an issue on this repository if you run into any issues or have a request!
