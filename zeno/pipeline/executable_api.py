from abc import ABC, abstractmethod


class Executable(ABC):
    def __init__(self):
        pass

    def save_executable(self, path: str):
        pass

    def load_executable(self, path: str):
        pass

    @abstractmethod
    def execute(self, input):
        pass

    @abstractmethod
    def pipe_outputs(self):
        pass

    @abstractmethod
    def export_outputs_js(self):
        pass

    @abstractmethod
    def new_executable(self):
        pass
