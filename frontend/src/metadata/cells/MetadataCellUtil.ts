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

/** Return default slice name of histogram buckets **/
export function bucketName(col: ZenoColumn, h: HistogramEntry) {
	if (col.metadataType === MetadataType.NOMINAL) {
		return col.name + " == " + h.bucket;
	} else if (col.metadataType === MetadataType.CONTINUOUS) {
		return (
			Number(h.bucket).toFixed(2) +
			" <= " +
			col.name +
			" < " +
			Number(h.bucketEnd).toFixed(2)
		);
	} else if (col.metadataType === MetadataType.BOOLEAN) {
		const value = h.bucket ? "true" : "false";
		return col.name + " == " + value;
	}
}

/** Create slices from metadata histogram buckets **/
export function createSlices(
	col: ZenoColumn,
	histogram: HistogramEntry[],
	folder: string,
	sliceNames: string[],
	selected: boolean[]
) {
	folders.update((f) => {
		f.push(folder);
		return [...f];
	});

	histogram.forEach((h, i) => {
		if (selected[i]) {
			const preds: FilterPredicate[] = [];
			const slicePredGroup: FilterPredicateGroup = { predicates: [], join: "" };

			if (col.metadataType === MetadataType.NOMINAL) {
				preds.push({
					column: col,
					operation: "==",
					value: h.bucket,
					join: "",
				});
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
			} else if (col.metadataType === MetadataType.BOOLEAN) {
				preds.push({
					column: col,
					operation: "==",
					value: h.bucket ? "true" : "false",
					join: "",
				});
			}

			slicePredGroup.predicates = preds;

			ZenoService.createNewSlice({
				sliceName: sliceNames[i],
				filterPredicates: slicePredGroup,
				folder: folder,
			}).then(() => {
				slices.update((s) => {
					s.set(sliceNames[i], <Slice>{
						sliceName: sliceNames[i],
						folder: folder,
						filterPredicates: slicePredGroup,
					});
					return s;
				});
			});
		}
	});
}
