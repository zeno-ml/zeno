class RegionBasedLabelerNode:
    def __init__(self):
        self.status = ""

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
        return [self.point_inside_polygon(point, polygon) for point in points]

    def fit(self, input):
        return self

    def transform(self, input):
        # this is going to totally fuck me in the ass
        self.labels = self.points_inside_polygon(input["projection2D"], self.model)
        self.input = input

        return self

    def pipe_outputs(self):
        return {**self.input, "labels": self.labels}

    def export_outputs_js(self):
        return {"labeler": self.labels}

    def save(self, path: str):
        with open(path, "w") as out_file:
            out_file.write(self.model)

    def load(self, path: str):
        with open(path, "r") as in_file:
            self.model = in_file.readline()

    def init(self, polygon: list):
        self.model = polygon
