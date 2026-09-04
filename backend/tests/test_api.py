"""
API tests for the compile/simulate wire contract. Studio glue is properly tested:
happy paths on the seed model, camelCase serialisation, CORS, and validation
errors. Uses the frontend's camelCase seed shape to exercise the real boundary.
"""

import copy

from fastapi.testclient import TestClient

from app.main import app
from app.seed import SEED_TREE

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_compile_seed_returns_camelcase_lotka_volterra():
    response = client.post("/compile", json={"tree": SEED_TREE})
    assert response.status_code == 200, response.text
    body = response.json()

    # Response is camelCase on the wire.
    assert set(body) == {
        "odes",
        "variableMappings",
        "parameterMappings",
        "context",
        "requiredInputs",
    }

    # Two aggregated surface ODEs.
    assert {ode["variable"] for ode in body["odes"]} == {"x", "y"}

    # Numeric context carries the seed's default parameter values.
    assert sorted(body["context"].values()) == [-0.2, -0.2, 0.1, 0.4, 10.0]

    # Short parameter symbols trace back to their hierarchical origins.
    assert "prey.r" in body["parameterMappings"].values()
    assert body["requiredInputs"] == []


def test_compile_odes_reference_only_context_symbols():
    body = client.post("/compile", json={"tree": SEED_TREE}).json()
    known = set(body["context"]) | {"x", "y"}
    for ode in body["odes"]:
        # Every alphabetic token in the RHS is a variable or a context parameter.
        import re

        tokens = set(re.findall(r"[A-Za-z]+_?\d*", ode["expression"]))
        assert tokens <= known, (ode, tokens - known)


def test_simulate_seed_returns_time_series():
    request = {
        "tree": SEED_TREE,
        "initialValues": {"x": 1, "y": 0.1},
        "tEnd": 100,
        "solver": "continuous",
    }
    response = client.post("/simulate", json=request)
    assert response.status_code == 200, response.text
    body = response.json()

    assert set(body["series"]) == {"x", "y"}
    assert len(body["times"]) == len(body["series"]["x"]) > 0
    assert body["series"]["x"][0] == 1.0
    assert body["series"]["y"][0] == 0.1


def test_simulate_discrete_solver():
    request = {
        "tree": SEED_TREE,
        "initialValues": {"x": 1, "y": 0.1},
        "tEnd": 10,
        "solver": "discrete",
        "dt": 0.1,
    }
    response = client.post("/simulate", json=request)
    assert response.status_code == 200, response.text
    assert len(response.json()["times"]) > 0


def test_cors_allows_vite_origin():
    response = client.options(
        "/compile",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_invalid_model_returns_422():
    broken = copy.deepcopy(SEED_TREE)
    # Point a variable wire at a child that does not exist.
    broken["variableWires"][0]["childPorts"] = ["ghost.x"]
    response = client.post("/compile", json={"tree": broken})
    assert response.status_code == 422
