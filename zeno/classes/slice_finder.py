from typing import List

from pydantic import BaseModel


class SliceFinderMetricReturn(BaseModel):
    metric: float
    list_of_trained_elements: List[object]
    slices_of_interest: List[object]
