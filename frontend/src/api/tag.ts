import {
	ZenoService,
	type GroupMetric,
	type TagMetricKey,
} from "../zenoservice";

export async function createNewTag(
	tagName: string,
	selectionIds = { ids: [] },
	folder = ""
) {
	await ZenoService.createNewTag({
		tagName: tagName,
		folder,
		selectionIds,
	});
}

export async function deleteTag(tagName: string) {
	await ZenoService.deleteTag([tagName]);
}

export async function getMetricsForTags(
	tagMetricKeys: TagMetricKey[]
): Promise<GroupMetric[]> {
	if (tagMetricKeys.length === 0) {
		return null;
	}
	if (tagMetricKeys[0].metric === undefined) {
		tagMetricKeys = tagMetricKeys.map((k) => ({ ...k, metric: "" }));
	}
	if (tagMetricKeys[0].model === undefined) {
		tagMetricKeys = tagMetricKeys.map((k) => ({ ...k, model: "" }));
	}

	if (tagMetricKeys.length > 0) {
		return await ZenoService.getMetricsForTags(tagMetricKeys);
	}
}
