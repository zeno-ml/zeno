---
sidebar_position: 1
---

# Introduction

Zeno is a general-purpose framework for evaluating machine learning models.
It combines a **Python API** with an **interactive UI** to allow users to discover, explore, and analyze the performance of their models across diverse use cases.
Zeno can be used for any data type or task with _modular views_ for everything from object detection to audio transcription.

```python title="Example Zeno functions for an image classification task"
@distill_function
def brightness(df, ops):
    return lum(df[ops.data_column]))

@metric_function
def accuracy(df, ops):
    return df[ops.label_column]
           == df[ops.output_column]
```

![teaser](/img/teaser.png)

## Why Zeno?

## Key Features
