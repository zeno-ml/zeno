from zeno.classes.base import ZenoColumn, ZenoColumnType
from sliceline.slicefinder import Slicefinder
import pandas as pd
import numpy as np

def slice_finder(df, req, zeno_options, metric_functions, columns):
    # setting up config important for the next steps

    minimum_size = int(req.minimumSize)
    
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
    # drop the id column
    updated_df = updated_df.drop(["id"], axis=1)

    print(list(updated_df))
    print(df.dtypes)
    all_categorical_data = updated_df.select_dtypes(include=["string", "boolean"],
                                                    exclude=[
                                                             "object"]).columns.tolist()
    
    #all_categorical_data.insert(0, "label")
    # print(all_categorical_data)
    all_categorical_data.remove("POSTDISTILLincorrectcifar_net_20")

    for row_name in all_categorical_data:
        updated_df[row_name] = pd.Categorical(updated_df[row_name]).codes

    # df_trans = pd.DataFrame(clf[0].transform(X), columns=clf[0].get_feature_names_out())

    result = metric_functions[req.sliceFinderMetric](df, local_ops)

    # print(updated_df.iloc[0])

    # load the correct error rate.
    errors = result.error_rate

    updated_df = updated_df[all_categorical_data]

    print(updated_df.dtypes)

    # slice finder code logic

    slice_finder = Slicefinder(alpha=0.99, k=minimum_size, max_l=(int)(req.depth))

    slice_finder.fit(updated_df, errors)

    print(slice_finder.top_slices_)

    print(slice_finder.average_error_)

    # X_trans = slice_finder.transform(X)

    # print(type(result))

    return {"metric": result.metric, "list_of_trained_elements": all_categorical_data,
            "slices_of_interest": (slice_finder.top_slices_).tolist()}
