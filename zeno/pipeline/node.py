from typing import Union

from .memory import PipelineMemory


class PipelineNode:
    def __init__(self):
        self.id = NodeId()
        self.state = {}
        self.memory: Union[PipelineMemory, None] = None

    def fit(self):
        pass

    def transform(self):
        pass

    def pipe_outputs(self):
        pass

    def export_outputs_js(self):
        pass

    def save(self, path: str):
        pass

    def load(self, path: str):
        pass

    def init(self):
        pass

    def get_memory(self):
        return self.memory

    def set_memory(self, memory: PipelineMemory):
        self.memory = memory

    def __repr__(self):
        return f"{self.__class__.__name__}"

    def json(self, state=True):
        return {
            "type": self.__repr__(),
            "id": str(self.id),
            "state": self.export_outputs_js() if state is True else None,
        }


class NodeId:
    def __init__(self):
        self.id = None
        self.generate_random_id()

    def generate_random_id(self):
        from uuid import uuid4

        self.id = uuid4()

    def __repr__(self) -> str:
        return str(self.id)

    def __str__(self) -> str:
        return self.__repr__()