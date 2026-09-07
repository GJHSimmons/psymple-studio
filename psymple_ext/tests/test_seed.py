"""
Light end-to-end check that the seed Lotka-Volterra tree ingests, compiles,
inspects and simulates. Mirrors frontend/src/engine/seedModel.ts (in snake_case).
"""

from psymple_ext import build_system, inspect_system, run_simulation

SEED = {
    "name": "ecosystem",
    "type": "cmp",
    "ports": {"input": [], "output": [], "variable": ["x", "y"]},
    "children": [
        {
            "name": "prey",
            "type": "cmp",
            "ports": {
                "input": [{"name": "r", "default": 0.4}, {"name": "K", "default": 10}],
                "output": [],
                "variable": ["x"],
            },
            "children": [
                {
                    "name": "pop",
                    "type": "ode",
                    "ports": {"input": [{"name": "r"}], "output": [], "variable": ["x"]},
                    "assignments": [{"target": "x", "expression": "r*x"}],
                },
                {
                    "name": "limit",
                    "type": "ode",
                    "ports": {
                        "input": [{"name": "r"}, {"name": "K"}],
                        "output": [],
                        "variable": ["x"],
                    },
                    "assignments": [{"target": "x", "expression": "-r/K*x**2"}],
                },
            ],
            "directed_wires": [
                {"source": "r", "destination": ["pop.r", "limit.r"]},
                {"source": "K", "destination": "limit.K"},
            ],
            "variable_wires": [{"child_ports": ["pop.x", "limit.x"], "parent_port": "x"}],
        },
        {
            "name": "pred",
            "type": "ode",
            "ports": {
                "input": [{"name": "r", "default": -0.2}],
                "output": [],
                "variable": ["x"],
            },
            "assignments": [{"target": "x", "expression": "r*x"}],
        },
        {
            "name": "pred-prey",
            "type": "ode",
            "ports": {
                "input": [{"name": "r_1", "default": -0.2}, {"name": "r_2", "default": 0.1}],
                "output": [],
                "variable": ["x", "y"],
            },
            "assignments": [
                {"target": "x", "expression": "r_1*x*y"},
                {"target": "y", "expression": "r_2*x*y"},
            ],
        },
    ],
    "variable_wires": [
        {"child_ports": ["prey.x", "pred-prey.x"], "parent_port": "x"},
        {"child_ports": ["pred.x", "pred-prey.y"], "parent_port": "y"},
    ],
}


def test_ingest_and_inspect():
    system = build_system(SEED)
    compiled = inspect_system(system)

    # Two surface ODEs, one per aggregated variable.
    variables = {ode["variable"] for ode in compiled["odes"]}
    assert variables == {"x", "y"}

    # Every parameter symbol appearing in an ODE resolves in the context.
    assert set(compiled["context"].values()) == {0.4, 10.0, -0.2, 0.1}

    # Mappings trace short symbols back to their hierarchical origin.
    assert "prey.r" in compiled["parameter_mappings"].values()
    assert compiled["required_inputs"] == []


def test_inspection_is_deterministic():
    a = inspect_system(build_system(SEED))
    b = inspect_system(build_system(SEED))
    assert a == b


def test_simulate_predator_prey():
    system = build_system(SEED)
    result = run_simulation(system, initial_values={"x": 1, "y": 0.1}, t_end=100)

    assert set(result["series"]) == {"x", "y"}
    assert len(result["times"]) == len(result["series"]["x"]) > 0
    # Initial conditions are the first sample of each series.
    assert result["series"]["x"][0] == 1.0
    assert result["series"]["y"][0] == 0.1
