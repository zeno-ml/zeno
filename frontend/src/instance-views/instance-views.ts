import { ZenoColumnType, type ZenoColumn } from "../zenoservice";
import { get } from "svelte/store";
import { model, settings } from "../stores";
import { columnHash } from "../util/util";

// component injected into div provided
export type ViewRenderFunction = (
	div: HTMLDivElement,
	options: object,
	entry: object,
	modelColumn: string,
	labelColumn: string,
	dataColumn: string,
	idColumn: string
) => void;

/**
 * from the zeno global state, fetches the
 * column name for model output
 */
export function modelOutputColumnName() {
	const modelColumn = {
		columnType: ZenoColumnType.OUTPUT,
		name: get(model),
	} as ZenoColumn;
	const modelColumnStr = model ? columnHash(modelColumn) : "";
	return modelColumnStr;
}

/**
 * Creates the view component from the view function
 * @param override takes in a HTMLDivElement that the viewFunction can
 * 					optionally override instead of creating a new div
 * @returns the component as a div element
 */
export function createViewComponent(
	viewFunction: ViewRenderFunction,
	entry: object,
	options: object,
	override?: HTMLDivElement
): HTMLDivElement {
	const modelColumn = modelOutputColumnName();

	// if no override, create a new div
	override ??= document.createElement("div");

	// overrides the passed in element with view
	const globalSettings = get(settings);
	viewFunction(
		override,
		options,
		entry,
		modelColumn,
		columnHash(globalSettings.labelColumn),
		columnHash(globalSettings.dataColumn),
		columnHash(globalSettings.idColumn)
	);

	return override;
}
