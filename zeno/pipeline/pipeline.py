from zeno.pipeline.lableler.region_based_labler import RegionBasedLabelerNode
from .projection.parametric_umap import ParametricUMAPNode
from .filter.hard_id_filter import HardFilterNode
from pandas import DataFrame


class Pipeline:
    def __init__(self, table: DataFrame, model_name: str, id_column: str):
        self.model_name = model_name
        self.id_column = id_column
        self.global_table = table
        self.input_table = table.copy(deep=False)

        self.io_memory = {
            "model": model_name,
            "input_table": self.input_table,
            "global_table": self.global_table,
            "id_column": self.id_column,
        }

        # the nodes to update
        self.init_projection = None
        self.mutators = []
        self.weak_labeler = None

    def fit_transform(self, node):
        node.fit(input=self.io_memory)
        node.transform(input=self.io_memory)
        self.io_memory = node.pipe_outputs()

    def set_init_projection(self):
        new_node = ParametricUMAPNode()
        new_node.init(n_components=2, n_epochs=40)
        self.fit_transform(new_node)
        self.init_projection = new_node

        return new_node.export_outputs_js()

    def add_filter_node(self, instance_ids):
        new_node = HardFilterNode()
        new_node.init(instance_ids)
        self.fit_transform(new_node)

        self.mutators.append(new_node)

        return new_node.export_outputs_js()

    def add_embedding_projection(self, args):
        new_node = ParametricUMAPNode()
        umap_args = {"n_components": 2, "n_epochs": 40, **args}
        new_node.init(**umap_args)
        self.fit_transform(new_node)

        self.mutators.append(new_node)

        return new_node.export_outputs_js()

    def add_weak_labeler(self, polygon):
        new_node = RegionBasedLabelerNode()
        new_node.init(polygon)

        self.weak_labeler = new_node

    def transform_node(self, node):
        self.io_memory = node.transform(self.io_memory).pipe_outputs()

    def transform_all(self):
        self.io_memory["input_table"] = self.global_table.copy(deep=False)
        self.transform_node(self.init_projection)
        for node in self.mutators:
            if isinstance(node, (HardFilterNode)) is not True:
                self.transform_node(node)
        self.transform_node(self.weak_labeler)
        return self.weak_labeler.export_outputs_js()

    def clear(self):
        self.io_memory["input_table"] = self.global_table.copy(deep=False)
        self.mutators = []
        self.weak_labeler = None
