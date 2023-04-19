<img src="https://zenoml.com/img/zeno.png" width="250px"/>

[![PyPI version](https://badge.fury.io/py/zenoml.svg)](https://badge.fury.io/py/zenoml)
![Github Actions CI tests](https://github.com/zeno-ml/zeno/actions/workflows/ci.yml/badge.svg)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/)
[![DOI](https://img.shields.io/badge/doi-10.1145%2F3544548.3581268-red)](https://cabreraalex.com/paper/zeno)
[![Discord](https://img.shields.io/discord/1086004954872950834)](https://discord.gg/km62pDKAkE)

Zeno is a general-purpose framework for evaluating machine learning models.
It combines a **Python API** with an **interactive UI** to allow users to discover, explore, and analyze the performance of their models across diverse use cases.
Zeno can be used for any data type or task with [modular views](https://zenoml.com/docs/views/) for everything from object detection to audio transcription.

### Demos

|                                    **Image Classification**                                     |                                         **Audio Transcription**                                          |                                       **Image Generation**                                       |                                        **Dataset Chatbot**                                        |                                       **Sensor Classification**                                        |
| :---------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------: |
|                                           Imagenette                                            |                                          Speech Accent Archive                                           |                                           DiffusionDB                                            |                                        LangChain + Notion                                         |                                              MotionSense                                               |
| [![Try with Zeno](https://zenoml.com/img/zeno-badge.svg)](https://zeno-ml-imagenette.hf.space/) | [![Try with Zeno](https://zenoml.com/img/zeno-badge.svg)](https://zeno-ml-audio-transcription.hf.space/) | [![Try with Zeno](https://zenoml.com/img/zeno-badge.svg)](https://zeno-ml-diffusiondb.hf.space/) | [![Try with Zeno](https://zenoml.com/img/zeno-badge.svg)](https://zeno-ml-langchain-qa.hf.space/) | [![Try with Zeno](https://zenoml.com/img/zeno-badge.svg)](https://zeno-ml-imu-classification.hf.space) |
|               [code](https://huggingface.co/spaces/zeno-ml/imagenette/tree/main)                |               [code](https://huggingface.co/spaces/zeno-ml/audio-transcription/tree/main)                |               [code](https://huggingface.co/spaces/zeno-ml/diffusiondb/tree/main)                |            [code](https://huggingface.co/spaces/zeno-ml/audio-transcription/tree/main)            |               [code](https://huggingface.co/spaces/zeno-ml/imu-classification/tree/main)               |

<br />

https://user-images.githubusercontent.com/4563691/220689691-1ad7c184-02db-4615-b5ac-f52b8d5b8ea3.mp4

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

Please reference our [CHI'23 paper](https://arxiv.org/pdf/2302.04732.pdf)

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

Chat with us on our [Discord channel](https://discord.gg/km62pDKAkE) or leave an issue on this repository if you run into any issues or have a request!
