# Classification

```python
@tester
def accuracy(output, metadata):
    return df[df[/* label column */] == output].shape[0] / df.shape[0] * 100


@tester
def false_positive(output, metadata):
    return df[(df[/* label column */] == 0) & (output == 1)].shape[0] / df.shape[0] * 100


@tester
def false_negative(output, metadata):
    return df[(df[/* label column */] == 1) & (output == 0)].shape[0] / df.shape[0] * 100
```
