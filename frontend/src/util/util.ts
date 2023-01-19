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

export function getMetricRange(res) {
	const range: [number, number] = [Infinity, -Infinity];
	Object.values(res).forEach((col) => {
		(col as Array<{ metric: number }>).forEach((entry) => {
			if (entry.metric !== null && entry.metric !== undefined) {
				range[0] = Math.min(range[0], entry.metric);
				range[1] = Math.max(range[1], entry.metric);
			}
		});
	});
	return range;
}
