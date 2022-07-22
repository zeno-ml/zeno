from copy import deepcopy

from ..node import PipelineNode


class HardFilterNode(PipelineNode):
    def __init__(self, instance_ids: list):
        super().__init__()
        self.instance_ids = instance_ids

    def fit(self):
        return self

    def __get_df_rows(self, dataframe, column, list_to_get):
        return dataframe[dataframe[column].isin(list_to_get)]

    def transform(self):
        self.filtered_table = self.__get_df_rows(
            self.memory.input_table, str(self.memory.id_column), self.instance_ids
        )
        return self

    def pipe_outputs(self):
        self.memory.input_table = self.filtered_table

        def filter_by_id(array_obj):
            return array_obj["id"] in self.instance_ids

        if self.memory.nice_projection is not None:
            self.memory.nice_projection = list(
                filter(filter_by_id, self.memory.nice_projection)
            )
        self.details = {"projection": deepcopy(self.memory.nice_projection)}
        return self.memory

    def export_outputs_js(self):
        return {
            "ids": self.instance_ids,
            "projection": self.memory.nice_projection
            if self.memory.nice_projection is not None
            else [],
        }

    def __repr__(self):
        return "Filter"
