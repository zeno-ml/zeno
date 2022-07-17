from .node import PipelineNode
from .memory import PipelineMemory
from .filter.hard_id_filter import HardFilterNode
from .lableler.region_based_labler import RegionBasedLabelerNode
from .projection.parametric_umap import ParametricUMAPNode


class Pipeline:
    def __init__(self):
        self.uid = None
        self.global_memory = PipelineMemory()
        self.pipeline: list[PipelineNode] = []
        self.labeler = None

        self.table = None
        self.model = None
        self.id_column = None
        self.name = "default"

    def reset_final_labeler(self):
        self.labeler = None

    def reset_weak_labeler_memory(self):
        self.global_memory.reset()
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
        self.global_memory.name = name

    def set_model(self, model):
        self.model = model
        self.global_memory.model = model

    def set_id_column(self, id_column):
        self.id_column = id_column
        self.global_memory.id_column = id_column

    def set_table(self, table):
        self.table = table
        self.global_memory.global_table = table
        self.global_memory.input_table = table.copy(deep=False)

    def add_filter(self, ids):
        new_node = HardFilterNode(ids)
        new_node.set_memory(self.global_memory)
        new_node.fit()

        self.pipeline.append(new_node)

    def add_umap(self, **kwargs):
        kwargs_umap = {"n_components": 2, "n_epochs": 20, **kwargs}

        new_node = ParametricUMAPNode(**kwargs_umap)
        new_node.set_memory(self.global_memory)
        new_node.fit()

        self.pipeline.append(new_node)

    def add_region_labeler(self, polygon):
        new_node = RegionBasedLabelerNode(polygon)
        new_node.set_memory(self.global_memory)
        new_node.fit()

        self.labeler = new_node

    def run(self):
        self.reset_weak_labeler_memory()
        output = self.global_memory
        js_export = {}
        for step_node in self.pipeline:
            output_obj = step_node.transform()
            output = output_obj.pipe_outputs()
            js_export = output_obj.export_outputs_js()

        return output, js_export

    def run_labeler(self):
        if self.labeler is not None:
            output, js_export = self.run()
            output_obj = self.labeler.transform()
            self.global_memory = output_obj.pipe_outputs()
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
