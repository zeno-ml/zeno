from ..node import PipelineNode
from copy import deepcopy


class HardFilterNode(PipelineNode):
    def __init__(self):
        super().__init__()
        self.status = ""

    def fit(self, input):
        self.input = input
        return self

    def __get_df_rows(self, dataframe, column, list_to_get=None):
        if list_to_get is None:
            return []
        return dataframe[dataframe[column].isin(list_to_get)]

    def transform(self, input):
        input_table = input.input_table
        id_column = input.id_column
        self.filtered_table = self.__get_df_rows(
            input_table, str(id_column), self.instance_ids
        )
        return self

    def pipe_outputs(self):
        self.input.input_table = self.filtered_table

        def filter_by_id(array_obj):
            return array_obj["id"] in self.instance_ids

        if self.input.nice_projection is not None:
            self.input.nice_projection = list(
                filter(filter_by_id, self.input.nice_projection)
            )
        self.details = {"projection": deepcopy(self.input.nice_projection)}
        return self.input

    def export_outputs_js(self):
        return {
            "ids": self.instance_ids,
            "projection": self.input.nice_projection
            if self.input.nice_projection is not None
            else [],
        }

    def save(self, path: str):
        pass

    def load(self, path: str):
        pass

    def init(self, instance_ids: list):
        self.instance_ids = instance_ids
        return self
