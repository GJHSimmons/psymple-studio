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
        "functions",
        "requiredInputs",
    }

    # The seed is all-numeric, so it has no functional parameters.
    assert body["functions"] == {}

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


def test_malformed_expression_returns_422():
    broken = copy.deepcopy(SEED_TREE)
    # A syntactically invalid assignment expression — the commonest editor typo.
    broken["children"][1]["assignments"][0]["expression"] = "2*"
    response = client.post("/compile", json={"tree": broken})
    assert response.status_code == 422, response.text


# A composite whose ODE input is a FunctionalPortedObject output (g = 2*b).
FUNCTIONAL_TREE = {
    "name": "model",
    "type": "cmp",
    "ports": {"input": [{"name": "b", "default": 0.5}], "output": [], "variable": ["x"]},
    "children": [
        {
            "name": "rate",
            "type": "fn",
            "ports": {"input": [{"name": "b"}], "output": [], "variable": []},
            "assignments": [{"target": "g", "expression": "2*b"}],
        },
        {
            "name": "pop",
            "type": "ode",
            "ports": {"input": [{"name": "g"}], "output": [], "variable": ["x"]},
            "assignments": [{"target": "x", "expression": "g*x"}],
        },
    ],
    "directedWires": [
        {"source": "b", "destination": "rate.b"},
        {"source": "rate.g", "destination": "pop.g"},
    ],
    "variableWires": [{"childPorts": ["pop.x"], "parentPort": "x"}],
}


def test_compile_exposes_functional_parameters():
    import re

    body = client.post("/compile", json={"tree": FUNCTIONAL_TREE}).json()
    assert "functions" in body and body["functions"]

    resolvable = set(body["context"]) | set(body["functions"]) | {"x"}
    for ode in body["odes"]:
        tokens = set(re.findall(r"[A-Za-z]+_?\d*", ode["expression"]))
        assert tokens <= resolvable, (ode, tokens - resolvable)


def test_simulate_functional_model():
    request = {
        "tree": FUNCTIONAL_TREE,
        "initialValues": {"x": 1},
        "tEnd": 5,
        "solver": "continuous",
    }
    response = client.post("/simulate", json=request)
    assert response.status_code == 200, response.text
    # x' = 2*0.5*x = x, so x grows from 1.
    assert response.json()["series"]["x"][-1] > 1.0
