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
	filterModels: string[],
	filterPredicates: FilterPredicateGroup,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean],
	tagIds: FilterIds,
	filterIds?: FilterIds,
	tagList?: Array<string>
) {
	const requestedColumns = completeColumns.filter(
		(c) =>
			c.columnType !== ZenoColumnType.EMBEDDING &&
			(filterModels.includes(c.model) || c.model === "")
	);
	const res = await ZenoService.getFilteredTable({
		columns: requestedColumns,
		filterModels,
		filterPredicates,
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
