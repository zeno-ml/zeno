import Component from "./Component.svelte";

export default function getView(
  table,
  modelColumn,
  labelColumn,
  dataColumn,
  transformColumn,
  idColumn
) {
  let div = document.createElement("div");

  const app = new Component({
    target: div,
    props: {
      table: table,
      modelColumn: modelColumn,
      labelColumn: labelColumn,
      dataColumn: dataColumn,
      transformColumn: transformColumn,
      idColumn: idColumn,
    },
  });
  return div;
}
