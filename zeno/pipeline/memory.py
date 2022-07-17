from typing import Union
from pandas import DataFrame
from ..classes import ZenoColumnType


class PipelineMemory:
    def __init__(
        self,
        projection: Union[list, None] = None,
        nice_projection: Union[list, None] = None,
        input_table: Union[DataFrame, None] = None,
        global_table: Union[DataFrame, None] = None,
        name: Union[str, None] = None,
        id_column: Union[ZenoColumnType, None] = None,
        model: Union[str, None] = None,
        labels: Union[list, None] = None,
    ):
        self.projection = projection
        self.nice_projection = nice_projection
        self.input_table = input_table
        self.global_table = global_table
        self.name = name
        self.id_column = id_column
        self.model = model
        self.labels = labels
