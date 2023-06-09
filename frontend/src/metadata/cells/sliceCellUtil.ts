import { selections } from "../../stores";
import { get } from "svelte/store";

/** click/unclick to select/deselect the slice
and with pressing shift key to select multiple slices */
export function selectSliceCell(e, sliceName) {
	if (
		get(selections).slices.length === 1 &&
		get(selections).slices.includes(sliceName)
	) {
		selections.update((s) => ({
			slices: [],
			metadata: s.metadata,
			tags: s.tags,
		}));
		return;
	}
	if (e.shiftKey) {
		if (get(selections).slices.includes(sliceName)) {
			selections.update((sel) => {
				sel.slices.splice(sel.slices.indexOf(sliceName), 1);
				return {
					slices: [...sel.slices],
					metadata: sel.metadata,
					tags: sel.tags,
				};
			});
		} else {
			selections.update((sel) => ({
				slices: [...sel.slices, sliceName],
				metadata: sel.metadata,
				tags: sel.tags,
			}));
		}
	} else {
		selections.update((sel) => ({
			slices: [sliceName],
			metadata: sel.metadata,
			tags: sel.tags,
		}));
	}
}

/** click/unclick to select/deselect the slice for model depended slices */
export function selectModelDependSliceCell(sliceName) {
	if (get(selections).slices.includes(sliceName)) {
		selections.update((sel) => {
			sel.slices.splice(sel.slices.indexOf(sliceName), 1);
			return {
				slices: [...sel.slices],
				metadata: sel.metadata,
				tags: sel.tags,
			};
		});
	} else {
		selections.update((sel) => ({
			slices: [...sel.slices, sliceName],
			metadata: sel.metadata,
			tags: sel.tags,
		}));
	}
}
