from zeno.classes.base import CamelModel
from zeno.classes.slice import FilterIds


class Tag(CamelModel):
    tag_name: str
    folder: str
    selection_ids: FilterIds


class TagMetricKey(CamelModel):
    tag: Tag
    model: str
    metric: str
