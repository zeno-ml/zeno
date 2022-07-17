from copy import deepcopy
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
        js_export = {}

        for step_node in self.pipeline:
            step_node.transform()
            self.global_memory = step_node.pipe_outputs()

        js_export = step_node.json()

        return self.global_memory, js_export

    def run_labeler(self):
        if self.labeler is not None:
            self.global_memory, js_export = self.run()
            self.labeler.transform()
            self.global_memory = self.labeler.pipe_outputs()
            return self.global_memory, self.labeler.json()

    def __repr__(self):
        result = f"UID: {self.uid}: "
        for step_node in self.pipeline:
            result += str(step_node) + " -> "
        result += str(self.labeler)
        return result

    def pipeline_repr(self, state=False):
        nodes_repr = []
        final_labeler_json = None
        if state is True:
            self.reset_weak_labeler_memory()
            for step_node in self.pipeline:
                step_node.transform()
                self.global_memory = step_node.pipe_outputs()
                js_export = step_node.json()
                nodes_repr.append(deepcopy(js_export))
        else:
            for step_node in self.pipeline:
                nodes_repr.append(step_node.json(state))

        final_labeler_json = None if self.labeler is None else self.labeler.json(state)
        return nodes_repr, final_labeler_json

    def json(self, state=False):
        pipeline, labeler = self.pipeline_repr(state)

        return {
            "name": self.name,
            "uid": self.uid,
            "model": self.model,
            "pipeline": pipeline,
            "labeler": labeler,
        }

    def populated(self):
        return len(self.pipeline) > 0

    def same(self, model: str, uid):
        return model == self.model and uid == self.uid
