import { ZenoService } from "../zenoservice";

export async function createNewTag(
	tagName: string,
	selectionIds = [],
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
