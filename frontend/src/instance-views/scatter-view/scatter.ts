import { get } from "svelte/store";
import { getFilteredIds } from "../../api/table";
import { model, selectionIds } from "../../stores";
import type {
	FilterIds,
	FilterPredicateGroup,
	Points2D,
} from "../../zenoservice";

export function getIndicesFromIds(
	allIds: string[] | number[],
	filterIds: string[] | number[]
) {
	const index = new Map();
	allIds.forEach((id, i) => {
		index.set(id, i);
	});
	const indices = filterIds.map((id) => index.get(id));
	return indices;
}
/**
 * Selects the points and gets the ids for the selected entries
 *
 * @todo make this native to the filter predicates somehow
 * right now I just consider it separate
 */
export function selectPoints(e: CustomEvent, points: Points2D) {
	const selectedIndices = e.detail;
	const selectedIds = selectedIndices.map((index) => points.ids[index]);
	selectionIds.set({ ids: selectedIds });
}
export function deselectPoints() {
	selectionIds.set({ ids: [] });
}
/**
 * assigns ones outside of the filter predicates as partial opacity
 * and ones inside full opacity
 */
export async function getPointOpacities(
	selectionPredicates: FilterPredicateGroup,
	points: Points2D,
	tagIds: FilterIds = { ids: [] },
	{ fullOpacity = 1, partialOpacity = 0.15 } = {}
) {
	const filteredIds = (await getFilteredIds(
		selectionPredicates,
		get(model),
		tagIds
	)) as string[];
	const filteredIdsIndex = new Map(filteredIds.map((id, index) => [id, index]));
	if (filteredIds.length > 0) {
		return points.ids.map((id) =>
			filteredIdsIndex.has(id) ? fullOpacity : partialOpacity
		);
	} else {
		return new Array(points.ids.length).fill(fullOpacity);
	}
}
