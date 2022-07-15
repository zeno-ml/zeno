from .filter.hard_id_filter import HardFilterNode
from .lableler.region_based_labler import RegionBasedLabelerNode
from .projection.parametric_umap import ParametricUMAPNode


class Pipeline:
    def __init__(self):
        self.uid = None
        self.weak_labeler_memory = {}
        self.weak_labeler = []
        self.final_labeler = None

        self.table = None
        self.model = None
        self.id_column = None
        self.name = "default"

    def reset_final_labeler(self):
        self.final_labeler = None

    def reset_weak_labeler_memory(self):
        self.weak_labeler_memory = {}
        if self.table is not None:
            self.set_table(self.table)
        if self.id_column is not None:
            self.set_id_column(self.id_column)
        if self.model is not None:
            self.set_model(self.model)

    def reset_weak_labeler(self):
        self.weak_labeler = []

    def set_uid(self, uid):
        self.uid = uid

    def set_name(self, name):
        self.name = name
        self.weak_labeler_memory["name"] = name

    def set_model(self, model):
        self.model = model
        self.weak_labeler_memory["model"] = model

    def set_id_column(self, id_column):
        self.id_column = id_column
        self.weak_labeler_memory["id_column"] = id_column

    def set_table(self, table):
        self.table = table
        self.weak_labeler_memory["global_table"] = table
        self.weak_labeler_memory["input_table"] = table.copy(deep=False)

    def add_filter(self, ids):
        new_node = HardFilterNode().init(ids).fit(self.weak_labeler_memory)
        self.weak_labeler.append(new_node)

    def add_umap(self, **kwargs):
        kwargs_umap = {"n_components": 2, "n_epochs": 20, **kwargs}
        new_node = (
            ParametricUMAPNode().init(**kwargs_umap).fit(self.weak_labeler_memory)
        )
        self.weak_labeler.append(new_node)

    def add_region_labeler(self, polygon):
        new_node = RegionBasedLabelerNode().init(polygon).fit(self.weak_labeler_memory)
        self.final_labeler = new_node

    def run(self):
        self.reset_weak_labeler_memory()
        output = self.weak_labeler_memory
        js_export = {}
        for step_node in self.weak_labeler:
            output_obj = step_node.transform(output)
            output = output_obj.pipe_outputs()
            js_export = output_obj.export_outputs_js()

        return output, js_export

    def run_labeler(self):
        if self.final_labeler is not None:
            output, js_export = self.run()
            output_obj = self.final_labeler.transform(output)
            self.weak_labeler_memory = output_obj.pipe_outputs()
            return output_obj.pipe_outputs(), output_obj.export_outputs_js()

    def __repr__(self):
        result = f"UID: {self.uid}: "
        for step_node in self.weak_labeler:
            result += str(step_node) + " -> "
        result += str(self.final_labeler)
        return result

    def json(self):
        weak_labeler_json = []
        final_labeler_json = None

        for step_node in self.weak_labeler:
            weak_labeler_json.append(step_node.json())
        final_labeler_json = (
            None if self.final_labeler is None else self.final_labeler.json()
        )

        return {
            "name": self.name,
            "uid": self.uid,
            "model": self.model,
            "pipeline": weak_labeler_json,
            "labeler": final_labeler_json,
        }

    def populated(self):
        return len(self.weak_labeler) > 0

    def same(self, model: str, uid):
        return model == self.model and uid == self.uid
