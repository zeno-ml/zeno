import os
import pickle
from typing import Callable


def blank_func():
    return None


class ValueCache:
    def __init__(self, path: str, name: str, internal_memory=True, file_memory=True):
        self.path = path
        self.name = f"{name}.pickle"
        self.file_ptr = os.path.join(self.path, self.name)
        self.internal_memory = internal_memory
        self.file_memory = file_memory

        self.memory = None

    @property
    def file_exists(self):
        return os.path.exists(self.file_ptr)

    @property
    def internal_exists(self):
        return self.memory is not None

    def file_remove(self):
        if self.file_exists:
            os.remove(self.file_ptr)

    def internal_remove(self):
        if self.internal_exists:
            self.memory = None

    def remove(self):
        self.file_remove()
        self.internal_remove()

    def file_set(self, value):
        if self.file_memory:
            with open(self.file_ptr, "wb") as f:
                pickle.dump(value, f)

    def internal_set(self, value):
        if self.internal_memory:
            self.memory = value

    def set(self, value):
        self.file_set(value)
        self.internal_set(value)

    def file_get(self):
        if self.file_exists:
            with open(self.file_ptr, "rb") as f:
                value = pickle.load(f)
                if self.internal_memory:
                    self.memory = value
                return value
        else:
            return None

    def internal_get(self):
        if self.internal_exists:
            return self.memory
        else:
            return None

    def get(self, default_func: Callable = blank_func):
        # first two check for if in cache
        if self.internal_exists:
            return self.internal_get()
        elif self.file_exists:
            return self.file_get()
        else:  # if not in cache, run the default
            # hard save to memory
            value = default_func()
            self.set(value)
            return value
