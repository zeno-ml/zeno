export async function getFilteredTable(
	completeColumns,
	filterPredicates: FilterPredicateGroup[],
	model: string,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean]
) {
	const requestedColumns = completeColumns.filter(
		(c) => c.model === "" || c.model === model
	);
	let res = await fetch("/api/filtered-table", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedColumns,
			filterPredicates: filterPredicates,
			sliceRange,
			sort,
		}),
	}).then((res) => res.json());
	res = JSON.parse(res);
	return res;
}

/**
 * Gets a list of ids from the filter predicates only
 */
export async function getFilteredIds(filterPredicates: FilterPredicateGroup[]) {
	let res = await fetch("/api/filtered-ids", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(filterPredicates),
	}).then((res) => res.json());
	res = JSON.parse(res);
	return res;
}
