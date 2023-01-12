import json

import pandas as pd

import pytest
from fastapi.testclient import TestClient

from zeno import zeno


@pytest.fixture()
def zeno_client():
    df = pd.DataFrame(
        [
            {"id": "gp", "label": "gas pump", "path": "gas_pump.JPEG"},
            {"id": "par", "label": "parachute", "path": "parachute.JPEG"},
            {"id": "tro", "label": "trombone", "path": "trombone.JPEG"},
        ]
    )

    app, zen = zeno(
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
    client = TestClient(app)  # type: ignore
    yield client
    client.close()


def test_settings(zeno_client):
    res = zeno_client.get("/api/settings")
    assert res.status_code == 200
    res = res.json()
    assert res["view"] == "image-classification"
    assert res["totalSize"] == 3


def test_slice_creation(zeno_client):
    res = zeno_client.post(
        "/api/create-new-slice",
        json={
            "sliceName": "test",
            "folder": "",
            "filterPredicates": {"join": "", "predicates": []},
        },
    )
    assert res.status_code == 200

    res = zeno_client.get("/api/slices")
    assert res.status_code == 200

    res = json.loads(res.json())
    assert len(res) > 0
    assert res[0]["sliceName"] == "test"


def test_folder_creation(zeno_client):
    res = zeno_client.post("/api/set-folders", json=["test"])
    assert res.status_code == 200

    res = zeno_client.get("/api/initialize")
    assert res.status_code == 200

    res = res.json()
    assert res["folders"][0] == "test"
