from typing import List, Union

from pandas import DataFrame

from ..classes import ZenoColumn


class PipelineMemory:
    def __init__(
        self,
        projection: Union[List[List[float]], None] = None,
        nice_projection: Union[List[dict], None] = None,
        input_table: Union[DataFrame, None] = None,
        global_table: Union[DataFrame, None] = None,
        name: Union[str, None] = None,
        id_column: Union[ZenoColumn, None] = None,
        model: Union[str, None] = None,
        labels: Union[List[Union[int, bool]], None] = None,
    ):
        self.projection = projection
        self.nice_projection = nice_projection
        self.input_table = input_table
        self.global_table = global_table
        self.name = name
        self.id_column = id_column
        self.model = model
        self.labels = labels

    def reset(self):
        self.projection = None
        self.nice_projection = None
        self.input_table = None
        self.global_table = None
        self.name = None
        self.id_column = None
        self.model = None
        self.labels = None
