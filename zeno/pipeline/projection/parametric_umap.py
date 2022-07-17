from ..node import PipelineNode
import numpy as np
from umap.parametric_umap import (  # type: ignore
    load_ParametricUMAP,  # type: ignore
    ParametricUMAP,  # type: ignore
)  # type: ignore

from ...classes import ZenoColumn, ZenoColumnType


class ParametricUMAPNode(PipelineNode):
    def __init__(self):
        super().__init__()
        self.status = ""

    def get_embeddings(self, table, model_name):
        embedding_col = ZenoColumn(
            column_type=ZenoColumnType.EMBEDDING,
            name=model_name,
        )
        embedding_col_name = str(embedding_col)
        embeddings_pd_col = table[embedding_col_name]  # type: ignore
        embeddings = np.stack(embeddings_pd_col.to_numpy())
        return embeddings

    def fit(self, input):
        embeddings = self.get_embeddings(input.input_table, input.model)
        self.model.fit(embeddings)

        return self

    def transform(self, input):
        embeddings = self.get_embeddings(input.input_table, input.model)
        self.projections = self.model.transform(embeddings).tolist()
        self.input = input

        return self

    def pipe_outputs(self):
        self.input.projection = [proj for proj in self.projections]
        id_column = self.input.id_column
        table = self.input.input_table
        ids = table[str(id_column)].tolist()
        self.input.nice_projection = self.__package_projection_export(
            self.projections, ids
        )
        return self.input

    def __package_projection_export(self, projection, instance_ids):
        payload = []
        for projection, instance_id in zip(projection, instance_ids):
            packaged_projection = {"proj": projection, "id": instance_id}
            payload.append(packaged_projection)
        return payload

    def export_outputs_js(self):
        return {"projection": self.input.nice_projection}

    def save(self, path: str):
        self.model.save(path)

    def load(self, path: str):
        self.model = load_ParametricUMAP(path)

    def init(self, *args, **kwargs):
        self.model = ParametricUMAP(*args, **kwargs)
        return self
