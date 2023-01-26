from enum import IntEnum
from typing import Optional

from pydantic import BaseModel


def to_camel(string):
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


class CamelModel(BaseModel):
    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class ZenoColumnType(IntEnum):
    METADATA = 0
    PREDISTILL = 1
    OUTPUT = 2
    EMBEDDING = 3
    POSTDISTILL = 4


class MetadataType(IntEnum):
    NOMINAL = 0
    CONTINUOUS = 1
    BOOLEAN = 2
    DATETIME = 3
    OTHER = 4


class ZenoColumn(CamelModel):
    column_type: ZenoColumnType
    name: str
    metadata_type: Optional[MetadataType] = MetadataType.OTHER
    model: Optional[str] = ""

    # Append the column type to the name unless it is a vanilla metadata column
    def __str__(self):
        m = ""
        if self.model is not None:
            m = self.model
        t = ""
        if self.column_type is not ZenoColumnType.METADATA:
            t = str(int(self.column_type))
        return t + self.name + m

    def __hash__(self):
        return hash(str(self))
