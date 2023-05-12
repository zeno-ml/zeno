import secrets

import numpy as np
from pandas.api.types import is_numeric_dtype
from sliceline.slicefinder import Slicefinder

from zeno.classes.base import ZenoColumnType
from zeno.classes.slice import FilterPredicate, FilterPredicateGroup, Slice


def find_right_column(columns, name):
    """Finds the right column given the df and zenocolumn.

    Args:
        columns: the list of all ZenoColumns.
        name: the name that appears in a dataframe and can be a match for a ZenoColumn.
    Returns the right column with the correct Zenocolumn name.
    """
    for i in range(0, len(columns)):
        if columns[i].__str__() == name:
            return columns[i]
    return


def find_right_column_name(columns, name):
    """Finds the right column given the df and zenocolumn.

    Args:
        columns: the list of all ZenoColumns.
        name: the name for a specific column.
    Returns the dataframe column name associated with the Zeno column name.
    """
    for i in range(0, len(columns)):
        if columns[i].name == name:
            return columns[i].__str__()
    return


def get_column_name_with_summary(df, columns):
    """Catering to the need to display column names with summary from frontend.
    Only need to call once per lifecycle.

    Args:
        df: the full data frame from the backend.
        columns: full list from ZenoColumn
    Returns column names with a summary of minimum and maximum values.
    """
    column_summary_dict = dict()
    updated_df = data_clean_for_columns(df, columns)
    all_df_column_name = updated_df.columns.to_numpy()
    for column in columns:
        for df_column_name in all_df_column_name:
            if column.__str__() == df_column_name:
                if is_numeric_dtype(df[df_column_name]):
                    column_summary_dict[column.name] = [
                        (str)(df[df_column_name].min()),
                        (str)(df[df_column_name].max()),
                    ]
                else:
                    column_summary_dict[column.name] = (
                        df[df_column_name].unique().tolist()
                    )
    return column_summary_dict


def data_clean_for_columns(df, columns=[]):
    updated_df = df.copy()
    if len(columns) > 0:
        excluded_types = [
            ZenoColumnType.EMBEDDING,
            ZenoColumnType.OUTPUT,
            ZenoColumnType.METADATA,
        ]
        for column in columns:
            if (
                column.column_type in excluded_types
                and column.__str__() in updated_df.columns
            ):
                updated_df = updated_df.drop(column.__str__(), axis=1)

    updated_df = updated_df.drop(list(updated_df.filter(regex="id")), axis=1)
    updated_df = updated_df.drop(list(updated_df.filter(regex="EMBEDDING")), axis=1)
    updated_df = updated_df.drop(list(updated_df.filter(regex="POSTDISTILL")), axis=1)
    updated_df = updated_df.drop(list(updated_df.filter(regex="OUTPUT")), axis=1)

    return updated_df


def slice_finder(df, req, zeno_options, metric_functions, columns):
    """Returns found slices based on certain heruisitics.

    Args:
        df: the dataframe from backend.
        req: the SliceFinderRequst with arguments
        zeno_options: options for zeno software.
        metric_functions: the metrics functions for filtering out data of interest
        columns:
    Returns a SliceFinderMetricReturn Object.
    """
    # setting up config important for the next steps
    minimum_size = int(req.minimum_size)

    # data cleaning

    updated_df = df.copy()

    df_column_name = find_right_column_name(columns, req.column_name)
    updated_df = data_clean_for_columns(updated_df)

    all_categorical_data = updated_df.columns.tolist()

    code_dict = dict()

    for row_name in all_categorical_data:
        target_list = updated_df[row_name].tolist()
        name_list = list(set(target_list))
        codes, uniques = updated_df[row_name].factorize(name_list)
        code_dict[row_name] = uniques
        updated_df[row_name] = codes

    # load the correct error rate. If it's the general case, use the error
    # rate itself. else, use the min_max normalized result to find the slices
    # with highest count metrics passed from the frontend.
    chosen_column_slice = updated_df[df_column_name]
    normalized_column = (chosen_column_slice - np.min(chosen_column_slice)) / (
        np.max(chosen_column_slice) - np.min(chosen_column_slice)
    )

    normalized_column = np.array(normalized_column, dtype=float)
    if req.order_by == "ascending":
        normalized_column = 1 - normalized_column
    errors = np.array(normalized_column, dtype=float)
    # slice finder code logic

    slice_finder = Slicefinder(alpha=0.99, k=minimum_size, max_l=(int)(req.depth))
    slice_finder.fit(updated_df, errors)

    # construct the top_slices_ into real slice objects

    all_data_column = updated_df.columns.tolist()

    slices_of_interest = []
    for slice_name in slice_finder.top_slices_:
        slice_name_result = "slicefinder-result-"
        predicate_list = []
        for i in range(0, len(slice_name)):
            slice_predicate_half = slice_name[i]
            if slice_predicate_half is not None:
                if all_data_column[i] in code_dict:
                    slice_predicate_half = code_dict[all_data_column[i]][
                        (int)(slice_predicate_half)
                    ]
                zeno_column = find_right_column(columns, all_data_column[i])
                join_val = "" if len(predicate_list) == 0 else "&"
                predicate_list.append(
                    FilterPredicate(
                        column=zeno_column,
                        operation="==",
                        value=slice_predicate_half,
                        join=join_val,
                    )
                )
                slice_name_result = (
                    slice_name_result + (str)(slice_predicate_half) + "-"
                )
        slice_name_result = slice_name_result + (str)(secrets.token_hex(3))

        slices_of_interest.append(
            Slice(
                slice_name=slice_name_result,
                folder="",
                filter_predicates=FilterPredicateGroup(
                    predicates=predicate_list, join=""
                ),
            )
        )

    return {
        "metric": slice_finder.average_error_,
        "list_of_trained_elements": all_data_column,
        "slices_of_interest": slices_of_interest,
    }
