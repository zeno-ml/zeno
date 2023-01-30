from typing import List

from zeno.classes.base import CamelModel


class ReportPredicate(CamelModel):
    slice_name: str
    metric: str


class Report(CamelModel):
    name: str
    report_type: str
    report_predicates: List[ReportPredicate]
