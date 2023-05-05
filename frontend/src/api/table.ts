import type {
	FilterIds,
	FilterPredicateGroup,
	ZenoColumn,
} from "../zenoservice";
import { ZenoService } from "../zenoservice/";
import { ZenoColumnType } from "./../zenoservice/models/ZenoColumnType";

export async function getFilteredTable(
	completeColumns,
	filterPredicates: FilterPredicateGroup,
	model: string,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean],
	filterIds?: FilterIds
) {
	const requestedColumns = completeColumns.filter(
		(c) =>
			c.columnType !== ZenoColumnType.EMBEDDING &&
			((c.columnType === ZenoColumnType.OUTPUT && c.model === model) ||
				(c.columnType === ZenoColumnType.POSTDISTILL && c.model === model) ||
				(c.columnType !== ZenoColumnType.OUTPUT &&
					c.columnType !== ZenoColumnType.POSTDISTILL))
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
export async function getFilteredIds(filterPredicates: FilterPredicateGroup) {
	const res = await ZenoService.getFilteredIds(filterPredicates);
	return JSON.parse(res);
}
