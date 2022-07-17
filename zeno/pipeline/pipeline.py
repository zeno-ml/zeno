from .memory import PipelineMemory
from .filter.hard_id_filter import HardFilterNode
from .lableler.region_based_labler import RegionBasedLabelerNode
from .projection.parametric_umap import ParametricUMAPNode


class Pipeline:
    def __init__(self):
        self.uid = None
        self.shared_memory = PipelineMemory()
        self.pipeline = []
        self.labeler = None

        self.table = None
        self.model = None
        self.id_column = None
        self.name = "default"

    def reset_final_labeler(self):
        self.labeler = None

    def reset_weak_labeler_memory(self):
        self.shared_memory = PipelineMemory()
        if self.table is not None:
            self.set_table(self.table)
        if self.id_column is not None:
            self.set_id_column(self.id_column)
        if self.model is not None:
            self.set_model(self.model)

    def reset_weak_labeler(self):
        self.pipeline = []

    def set_uid(self, uid):
        self.uid = uid

    def set_name(self, name):
        self.name = name
        self.shared_memory.name = name

    def set_model(self, model):
        self.model = model
        self.shared_memory.model = model

    def set_id_column(self, id_column):
        self.id_column = id_column
        self.shared_memory.id_column = id_column

    def set_table(self, table):
        self.table = table
        self.shared_memory.global_table = table
        self.shared_memory.input_table = table.copy(deep=False)

    def add_filter(self, ids):
        new_node = HardFilterNode().init(ids).fit(self.shared_memory)
        self.pipeline.append(new_node)

    def add_umap(self, **kwargs):
        kwargs_umap = {"n_components": 2, "n_epochs": 20, **kwargs}
        new_node = ParametricUMAPNode().init(**kwargs_umap).fit(self.shared_memory)
        self.pipeline.append(new_node)

    def add_region_labeler(self, polygon):
        new_node = RegionBasedLabelerNode().init(polygon).fit(self.shared_memory)
        self.labeler = new_node

    def run(self):
        self.reset_weak_labeler_memory()
        output = self.shared_memory
        js_export = {}
        for step_node in self.pipeline:
            output_obj = step_node.transform(output)
            output = output_obj.pipe_outputs()
            js_export = output_obj.export_outputs_js()

        return output, js_export

    def run_labeler(self):
        if self.labeler is not None:
            output, js_export = self.run()
            output_obj = self.labeler.transform(output)
            self.shared_memory = output_obj.pipe_outputs()
            return output_obj.pipe_outputs(), output_obj.export_outputs_js()

    def __repr__(self):
        result = f"UID: {self.uid}: "
        for step_node in self.pipeline:
            result += str(step_node) + " -> "
        result += str(self.labeler)
        return result

    def json(self):
        weak_labeler_json = []
        final_labeler_json = None

        for step_node in self.pipeline:
            weak_labeler_json.append(step_node.json())
        final_labeler_json = None if self.labeler is None else self.labeler.json()

        return {
            "name": self.name,
            "uid": self.uid,
            "model": self.model,
            "pipeline": weak_labeler_json,
            "labeler": final_labeler_json,
        }

    def populated(self):
        return len(self.pipeline) > 0

    def same(self, model: str, uid):
        return model == self.model and uid == self.uid
