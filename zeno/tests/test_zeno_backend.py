import pandas as pd
import pytest

from zeno import distill, zeno, ZenoOptions


@distill
def add_one(df, ops: ZenoOptions):
    return df[ops.data_path] + "1"


@pytest.fixture()
def zeno_client():
    df = pd.DataFrame(
        [
            {"id": "gp", "label": "gas pump", "path": "gas_pump.JPEG"},
            {"id": "par", "label": "parachute", "path": "parachute.JPEG"},
            {"id": "tro", "label": "trombone", "path": "trombone.JPEG"},
        ]
    )

    zen = zeno(
        {
            "view": "image-classification",
            "metadata": df,
            "data_path": "./imgs/",
            "data_column": "path",
            "id_column": "id",
            "label_column": "label",
            "batch_size": 2,
            "port": 8133,
            "serve": False,
        }
    )

    return zen


def test_settings(zeno_client):
    assert zeno_client.view == "image-classification"


def test_folders(zeno_client):
    zeno_client.set_folders(["imgs"])
    assert zeno_client.folders == ["imgs"]


def test_reports(zeno_client):
    zeno_client.set_reports(
        [{"name": "test", "report_type": "classification", "report_predicates": []}]
    )
    assert zeno_client.reports == [
        {"name": "test", "report_type": "classification", "report_predicates": []}
    ]


def test_df(zeno_client):
    assert zeno_client.df.shape == (3, 3)
