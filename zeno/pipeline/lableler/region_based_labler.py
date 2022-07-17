from ..node import PipelineNode


class RegionBasedLabelerNode(PipelineNode):
    def __init__(self, polygon: list[list[float]]):
        super().__init__()
        self.model = polygon

    def point_inside_polygon(self, point: list, polygon: list[list]):
        x, y = point
        n = len(polygon)
        inside = False
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def points_inside_polygon(self, points: list[list], polygon: list[list]):
        return [int(self.point_inside_polygon(point, polygon)) for point in points]

    def fit(self):
        return self

    def transform(self):
        self.labels = self.points_inside_polygon(self.memory.projection, self.model)
        return self

    def pipe_outputs(self):
        self.memory.labels = self.labels
        return self.memory

    def export_outputs_js(self):
        return {
            "labels": self.labels,
            "ids": self.memory.input_table[str(self.memory.id_column)].tolist(),
        }
