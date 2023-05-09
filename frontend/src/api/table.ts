import type {
	FilterIds,
	FilterPredicateGroup,
	ZenoColumn,
} from "../zenoservice";
import { ZenoService } from "../zenoservice/";
import { ZenoColumnType } from "./../zenoservice/models/ZenoColumnType";
import { setModelForFilterPredicateGroup } from "./slice";

export async function getFilteredTable(
	completeColumns,
	filterPredicates: FilterPredicateGroup,
	model: string,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean],
	tagIds: FilterIds,
	filterIds?: FilterIds,
	tagList?: Array<string>
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
		filterPredicates: setModelForFilterPredicateGroup(filterPredicates, model),
		sliceRange,
		sort,
		tagIds,
		filterIds,
		tagList,
	});
	return JSON.parse(res);
}

/**
 * Gets a list of ids from the filter predicates only
 */
export async function getFilteredIds(
	filterPredicates: FilterPredicateGroup,
	model: string,
	tagIds: FilterIds = { ids: [] }
) {
	const res = await ZenoService.getFilteredIds({
		filterPredicates: setModelForFilterPredicateGroup(filterPredicates, model),
		tagIds,
	});
	return JSON.parse(res);
}
