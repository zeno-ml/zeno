import { postRequest } from "../../util/request";
type Point2D = [number, number];

interface SnapshotStructure<T> {
	name: string;
	ids: T[];
	start2D: Point2D[];
}

function setIntersect<T>(a: Set<T>, b: Set<T>) {
	const outputSet = new Set<T>();
	for (const element of a) {
		const commonElement = b.has(element);
		if (commonElement) {
			outputSet.add(element);
		}
	}
	return outputSet;
}

/**
 * A snapshot of the current state of the scatter plot.
 * conceptually, another starting point to start from
 * This is a class so we can add methods in the future to it
 */
export class Snapshot implements SnapshotStructure<string> {
	name: string;
	ids: string[];
	start2D: Point2D[];
	constructor({
		name,
		ids,
		start2D = [],
	}: Partial<SnapshotStructure<string>> = {}) {
		this.name = name ?? "";
		this.ids = ids;
		this.start2D = start2D;
	}

	protected copyIds() {
		return this.ids;
	}
	protected copy2D() {
		return this.start2D;
	}
	protected copyName() {
		return this.name;
	}
	copy() {
		return new Snapshot({
			ids: this.copyIds(),
			start2D: this.copy2D(),
			name: this.copyName(),
		});
	}

	filter(ids: string[]) {
		// filters from the totalIds corresponds to an intersect
		const totalIds = new Set(this.ids);
		const constraint = new Set(ids);

		// The result if we only filter within the starting ids
		const withinTotalIds = setIntersect(totalIds, constraint);

		// based on the intersect, take those points and only use them
		const filtered2D = this.start2D.filter((_, i) =>
			withinTotalIds.has(this.ids[i])
		);
		const filteredIds = this.ids.filter((id) => withinTotalIds.has(id));

		return new Snapshot({
			name: this.name,
			ids: filteredIds,
			start2D: filtered2D,
		});
	}
	async project(model: string, transform: string, perplexity = 30) {
		const projection2D = await project({
			model,
			transform,
			ids: this.ids,
			perplexity,
		});
		return new Snapshot({
			name: this.name,
			ids: this.ids,
			start2D: projection2D,
		});
	}
}

interface ProjectResponse {
	data: Point2D[];
	model: string;
}
async function project(payload: {
	model: string;
	transform: string;
	ids?: string[];
	perplexity?: number;
}): Promise<Point2D[]> {
	const req = (await postRequest({
		url: "api/mirror/project",
		payload,
	})) as ProjectResponse;
	return req?.data;
}
