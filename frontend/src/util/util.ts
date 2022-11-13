import { tab, report, metricRange } from "../stores";

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
		col.columnType +
		col.name +
		(col.model ? col.model : "") +
		(col.transform ? col.transform : "")
	);
}

export function getMetricRange(res) {
	const range: [number, number, boolean] = [Infinity, -Infinity, true];
	Object.values(res).forEach((col) => {
		(col as Array<any>).forEach((entry) => {
			if (entry.metric) {
				range[0] = Math.min(range[0], entry.metric);
				range[1] = Math.max(range[1], entry.metric);
			}
		});
	});
	metricRange.set(range);
}
