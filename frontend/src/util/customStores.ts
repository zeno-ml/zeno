import { ZenoService, type Report } from "../zenoservice";
import { writable, type Writable } from "svelte/store";

export function folderWritable() {
	let val = [];
	const { subscribe, set } = writable(val);

	function fetchSet(v) {
		val = v;
		ZenoService.setFolders(val);
		set(val);
	}

	function fetchUpdate(fn) {
		val = fn(val);
		fetchSet(val);
	}

	return <Writable<string[]>>{
		subscribe,
		set: (v) => fetchSet(v),
		update: (fn) => fetchUpdate(fn),
	};
}

export function reportWritable() {
	let val = [];
	const { subscribe, set } = writable(val);

	function fetchSet(v) {
		val = v;
		ZenoService.updateReports(val);
		set(val);
	}

	function fetchUpdate(fn) {
		val = fn(val);
		fetchSet(val);
	}

	return <Writable<Report[]>>{
		subscribe,
		set: (v) => fetchSet(v),
		update: (fn) => fetchUpdate(fn),
	};
}
