---
sidebar_position: 1
---

# Introduction

Zeno is a general-purpose framework for evaluating machine learning models.
It combines a **Python API** with an **interactive UI** to allow users to discover, explore, and analyze the performance of their models across diverse use cases.
Zeno can be used for any data type or task with [modular views](/docs/views/) for everything from object detection to audio transcription.

<!-- ![teaser](/img/teaser.png) -->

<img style={{border: '1px solid #e8e8e8', padding: '5px', borderRadius: '3px'}} src="/img/teaser.png" />

<p style={{fontStyle: 'italic', marginBottom: '30px'}}>Exploring a CIFAR-10 model using Zeno.</p>

```python title="Example Zeno functions for an image classification task"
@distill
def brightness(df, ops):
    return lum(df[ops.data_column]))

@metric
def accuracy(df, ops):
    return df[ops.label_column]
           == df[ops.output_column]
```

<p style={{fontStyle: 'italic', marginTop: '-10px'}}>Example Zeno functions for deriving new metadata columns and calculating model metrics.</p>

## Why Zeno?

Zeno helps you move beyond relying on aggregate metrics and spot-checking model outputs.
Instead, it allows you to develop a deep, quantitative understanding of how your model behaves.

### Look at your data

### Check use cases

### Discover trends

## Key Features

### Python API

### Exploration UI

### Analysis Dashboard
