from typing import List, Union

from zeno.classes.base import CamelModel


class Tag(CamelModel):
    tag_name: str
    folder: str
    selection_ids: List[str]


class TagMetricKey(CamelModel):
    tag: Tag
    model: str
    metric: str

# class TagMetricRequest(CamelModel):
#     tag_metric_keys: List[TagMetricKey]
