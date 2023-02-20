from typing import List, Union

from zeno.classes.base import CamelModel


class Tag(CamelModel):
    tag_name: str
    folder: str
    selection_ids: List[str]


class TagMetric(CamelModel):
    metric: Union[float, None]
    size: int
