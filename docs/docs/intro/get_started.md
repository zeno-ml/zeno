---
sidebar_position: 1
---

# Getting Started

1. Install the Zeno Python package.

```bash
pip install zenoml
```

2. Create a folder with at least one Python file and a `predict_function`.
   Add any number of Zeno modules using the `distill` and `metric` functions.
   See the [Python API](/docs/api) for details on each of these modules.

3. Install a Zeno View for your given task from the [list of supported views](/docs/views), e.g. for image classification:

```bash
pip install zenoml-image-classification
```

4. Create a configuration `TOML` file with the [required options](/docs/configuration).

5. Run Zeno:

```bash
zeno config.toml
```
