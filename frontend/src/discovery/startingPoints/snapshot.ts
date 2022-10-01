import { postRequest } from "../../util/request";
type Point2D = [number, number];

interface SnapshotStructure<T> {
	name: string;
	ids: T[];
	start2D: Point2D[];
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
	constructor(snapshot: Partial<SnapshotStructure<string>>) {
		this.name = snapshot.name;
		this.ids = snapshot.ids;
		this.start2D = snapshot.start2D;
	}
	overrideFilter(ids: string[]) {
		const filtered = this.deriveFilter(ids);
		filtered.name = this.name;
		this.overrideThisSnapshot(filtered);
	}
	async overrideProjection(model: string, transform: string) {
		const projection = await this.deriveProjection(model, transform);
		projection.name = this.name;
		this.overrideThisSnapshot(projection);
	}
	deriveFilter(ids: string[]) {
		const filtered2D = this.start2D.filter((_, i) => ids.includes(this.ids[i]));
		return new Snapshot({
			name: `filter(${this.name} -> ${ids.length})`,
			ids,
			start2D: filtered2D,
		});
	}
	async deriveProjection(model: string, transform: string) {
		const projection2D = await project(model, transform, this.ids);
		return new Snapshot({
			name: `project(${this.name})`,
			ids: this.ids,
			start2D: projection2D,
		});
	}
	protected overrideThisSnapshot(sh: Snapshot) {
		this.ids = sh.ids;
		this.start2D = sh.start2D;
		this.name = sh.name;
	}
}

interface ProjectResponse {
	data: Point2D[];
	model: string;
}
async function project(
	model: string,
	transform: string,
	ids?: string[]
): Promise<Point2D[]> {
	const req = (await postRequest({
		url: "api/mirror/project",
		payload: { model, transform, ids },
	})) as ProjectResponse;
	return req?.data;
}
