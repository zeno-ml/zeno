import os
import pickle
from abc import ABC, abstractmethod


class MemoryFormat(ABC):
    @abstractmethod
    def get(self):
        pass

    @abstractmethod
    def set(self, value):
        pass

    @abstractmethod
    def exists(self):
        pass

    @abstractmethod
    def free(self):
        pass


class PickleMemory(MemoryFormat):
    def __init__(self, path: str, name: str):
        self.path = path
        self.name = f"{name}.pickle"
        self.file_ptr = os.path.join(self.path, self.name)

    def get(self):
        if self.exists():
            with open(self.file_ptr, "rb") as f:
                return pickle.load(f)
        else:
            return None

    def set(self, value):
        with open(self.file_ptr, "wb") as f:
            pickle.dump(value, f)

    def exists(self):
        return os.path.exists(self.file_ptr)

    def free(self):
        if self.exists():
            os.remove(self.file_ptr)


class ValueCache(PickleMemory):
    def __init__(self, path: str, name: str):
        super().__init__(path, name)
