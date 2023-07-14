import { folders, slices } from "../../stores";
import type { HistogramEntry } from "../../api/metadata";
import {
	MetadataType,
	ZenoService,
	type FilterPredicate,
	type FilterPredicateGroup,
	type Slice,
	type ZenoColumn,
} from "../../zenoservice";

/** Create slices from metadata histogram buckets **/
export function createSlices(
	col: ZenoColumn,
	histogram: HistogramEntry[],
	folder: string
) {
	folders.update((f) => {
		f.push(folder);
		return [...f];
	});

	histogram.forEach((h) => {
		const preds: FilterPredicate[] = [];
		const slicePredGroup: FilterPredicateGroup = { predicates: [], join: "" };

		let sliceName = "";

		if (col.metadataType === MetadataType.NOMINAL) {
			preds.push({
				column: col,
				operation: "==",
				value: h.bucket,
				join: "",
			});
			sliceName = col.name + " == " + h.bucket;
		} else if (col.metadataType === MetadataType.CONTINUOUS) {
			preds.push({
				column: col,
				operation: ">=",
				value: h.bucket,
				join: "",
			});
			preds.push({
				column: col,
				operation: "<",
				value: h.bucketEnd,
				join: "&",
			});
			sliceName =
				Number(h.bucket).toFixed(2) +
				" <= " +
				col.name +
				" < " +
				Number(h.bucketEnd).toFixed(2);
		} else if (col.metadataType === MetadataType.BOOLEAN) {
			const value = h.bucket ? "true" : "false";
			preds.push({
				column: col,
				operation: "==",
				value: value,
				join: "",
			});
			sliceName = col.name + " == " + value;
		}

		slicePredGroup.predicates = preds;
		ZenoService.createNewSlice({
			sliceName,
			filterPredicates: slicePredGroup,
			folder: folder,
		}).then(() => {
			slices.update((s) => {
				s.set(sliceName, <Slice>{
					sliceName,
					folder: folder,
					filterPredicates: slicePredGroup,
				});
				return s;
			});
		});
	});
}
