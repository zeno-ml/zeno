import type {
	FilterIds,
	FilterPredicateGroup,
	ZenoColumn,
} from "../zenoservice";
import { ZenoService } from "../zenoservice/";

export async function getFilteredTable(
	completeColumns,
	filterPredicates: FilterPredicateGroup[],
	model: string,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean],
	filterIds?: FilterIds
) {
	const requestedColumns = completeColumns.filter(
		(c) => c.model === "" || c.model === model
	);
	const res = await ZenoService.getFilteredTable({
		columns: requestedColumns,
		filterPredicates: filterPredicates,
		sliceRange,
		sort,
		filterIds,
	});
	return JSON.parse(res);
}

/**
 * Gets a list of ids from the filter predicates only
 */
export async function getFilteredIds(filterPredicates: FilterPredicateGroup[]) {
	const res = await ZenoService.getFilteredIds(filterPredicates);
	return JSON.parse(res);
}
