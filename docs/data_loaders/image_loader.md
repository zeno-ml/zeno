# Image Loader

```python
@load_data
def load_data(df_metadata, id_col, data_path):
    return [PIL.Image.open(os.path.join(data_path, img)) for img in df_metadata[id_col]]
```
