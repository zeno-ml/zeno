import { ZenoColumnType } from "../globals";
import { tab, report } from "../stores";

export function updateTab(t: string) {
	report.set(-1);
	if (t === "home") {
		window.location.hash = "";
	} else {
		window.location.hash = "#/" + t + "/";
	}
	tab.set(t);
}

export function columnHash(col: ZenoColumn) {
	return (
		(col.columnType === ZenoColumnType.METADATA ? "" : col.columnType) +
		col.name +
		(col.model ? col.model : "")
	);
}

/** Calculate the metric range for coloring histograms */
export function getMetricRange(res: number[][]): [number, number] {
	const range: [number, number] = [Infinity, -Infinity];
	let allNull = true;
	res.forEach((arr) =>
		arr.forEach((n) => {
			if (n !== null) {
				allNull = false;
			}
			range[0] = Math.min(range[0], n);
			range[1] = Math.max(range[1], n);
		})
	);
	if (allNull) {
		return [Infinity, -Infinity];
	}
	return range;
}
