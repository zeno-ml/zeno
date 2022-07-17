from .memory import PipelineMemory


class PipelineNode:
    def __init__(self):
        self.id = NodeId()
        self.details = {}

    def fit(self, input: PipelineMemory):
        pass

    def transform(self, input: PipelineMemory):
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

    def __repr__(self):
        return f"{self.__class__.__name__}"

    def json(self):
        return {"type": self.__repr__(), "id": str(self.id), "details": self.details}


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
