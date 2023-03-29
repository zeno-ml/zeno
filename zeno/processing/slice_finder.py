from zeno.classes.base import ZenoColumn, ZenoColumnType
from sliceline.slicefinder import Slicefinder
import pandas as pd
import numpy as np


def slice_finder(df, req, zeno_options, metric_functions, columns):
    # start testing if the backend will work

    output_col = ZenoColumn(
        column_type=ZenoColumnType.OUTPUT,
        name=req.model,
    )
    output_hash = str(output_col)

    distill_fns = [
        c
        for c in columns
        if (
            c.column_type == ZenoColumnType.PREDISTILL
            or c.column_type == ZenoColumnType.POSTDISTILL
        )
        and c.model == req.model
    ]

    local_ops = zeno_options.copy(
        update={
            "output_column": output_hash,
            "distill_columns": dict(
                zip([c.name for c in distill_fns], [str(c) for c in distill_fns])
            ),
        }
    )

    updated_df = df.copy(deep=True)

    updated_df = updated_df.reset_index(drop=True)

    print(df.columns.tolist())

    # drop the id column

    updated_df = updated_df.drop(["id"], axis=1)

    all_categorical_data = updated_df.select_dtypes(include=["object"]).columns.tolist()

    print(all_categorical_data)

    for row_name in all_categorical_data:
        updated_df[row_name] = pd.Categorical(updated_df[row_name]).codes

    print(updated_df)

    # df_trans = pd.DataFrame(clf[0].transform(X), columns=clf[0].get_feature_names_out())

    result = metric_functions[req.sliceFinderMetric](df, local_ops)

    # print(updated_df)

    df_size = len(updated_df.index)

    # print(updated_df.iloc[0])

    # dummy data: error
    errors = pd.DataFrame(
        # np.random.rand(10000, 1),
        np.zeros((10000, 1)),
        index=np.arange(df_size),
        columns=np.arange(1),
    )

    # dummy modification on error
    for idx, entry in updated_df["label"].iteritems():
        if entry == 7:
            errors[0][idx] = 1.0

    updated_df = updated_df[["label"]]

    # slice finder code logic

    slice_finder = Slicefinder()

    slice_finder.fit(updated_df, np.ravel(errors))

    print(slice_finder.top_slices_)

    # X_trans = slice_finder.transform(X)

    print(result)
    # print(type(result))
    return {"metric": result.metric, "variance": result.variance}
