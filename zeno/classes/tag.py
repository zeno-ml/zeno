from typing import List, Optional, Union

from zeno.classes.base import CamelModel, ZenoColumn

class Tag(CamelModel):
    tag_name: str
    folder: str
    selection_ids: List[str]


class TagMetric(CamelModel):
    metric: Union[float, None]
    size: int