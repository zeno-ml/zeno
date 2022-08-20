import importlib

import numpy as np

from zeno.classes import ZenoColumn, ZenoColumnType
from zeno.pipeline.node import PipelineNode


class ParametricUMAPNode(PipelineNode):
    def __init__(self, *args, **kwargs):
        super().__init__()
        umap_module = importlib.import_module("umap")
        self.load_ParametricUMAP = umap_module.parametric_umap.load_ParametricUMAP
        self.ParametricUMAP = umap_module.parametric_umap.ParametricUMAP

        self.model = self.ParametricUMAP(*args, **kwargs)

    def get_embeddings(self, table, model_name):
        embedding_col = ZenoColumn(
            column_type=ZenoColumnType.EMBEDDING,
            name=model_name,
        )
        embedding_col_name = str(embedding_col)
        embeddings_pd_col = table[embedding_col_name]  # type: ignore
        embeddings = np.stack(embeddings_pd_col.to_numpy())
        return embeddings

    def fit(self):
        embeddings = self.get_embeddings(self.memory.input_table, self.memory.model)
        self.model.fit(embeddings)

        return self

    def transform(self):
        embeddings = self.get_embeddings(self.memory.input_table, self.memory.model)
        self.projections = self.model.transform(embeddings).tolist()

        return self

    def pipe_outputs(self):
        projection = [proj for proj in self.projections]
        assert self.memory.input_table is not None, "input_table must be present"
        assert self.memory.id_column is not None, "id_column must be present"
        id_column = self.memory.id_column
        table = self.memory.input_table
        ids = table[str(id_column)].tolist()
        self.memory.nice_projection = self.__package_projection_export(projection, ids)
        return self.memory

    def __package_projection_export(self, projection, instance_ids):
        payload = []
        for proj, instance_id in zip(projection, instance_ids):
            packaged_projection = {"proj": proj, "id": instance_id}
            payload.append(packaged_projection)
        return payload

    def export_outputs_js(self):
        return {"projection": self.memory.nice_projection}

    def save(self, path: str):
        self.model.save(path)

    def load(self, path: str):
        self.model = self.load_ParametricUMAP(path)

    def __repr__(self):
        return "Projection"
