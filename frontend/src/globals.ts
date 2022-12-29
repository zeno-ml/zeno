export enum ZenoColumnType {
	// Metadata column from passed in CSV or Parquet file.
	METADATA,
	// Distill column dependent only on input data.
	PREDISTILL,
	// Output column for each model/transform combination.
	OUTPUT,
	// Column with embedding dimensions for projection.
	EMBEDDING,
	// Distill column dependent on model output.
	POSTDISTILL,
}

export enum MetadataType {
	NOMINAL,
	CONTINUOUS,
	BOOLEAN,
	DATETIME,
	OTHER,
}
