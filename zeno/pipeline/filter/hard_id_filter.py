class HardFilterNode:
    def __init__(self):
        self.status = ""

    def fit(self, input: dict):
        self.input = input

        return self

    def __get_df_rows(self, dataframe, column, list_to_get=None):
        if list_to_get is None:
            return []
        return dataframe[dataframe[column].isin(list_to_get)]

    def transform(self, input: dict):
        input_table = input["input_table"]
        id_column = self.input["id_column"]
        self.filtered_table = self.__get_df_rows(
            input_table, str(id_column), self.instance_ids
        )
        return self

    def pipe_outputs(self):
        self.input["input_table"] = self.filtered_table
        return self.input

    def export_outputs_js(self):
        return {"status": "added hard id filter"}

    def save(self, path: str):
        pass

    def load(self, path: str):
        pass

    def init(self, instance_ids: list):
        self.instance_ids = instance_ids

    def __repr__(self):
        return "HardFilterNode"
