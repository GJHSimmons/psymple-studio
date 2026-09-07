"""
A model whose ODE input is driven by a FunctionalPortedObject: the ODE references
a parameter (``rate.g = 2*b``) that is a function, not a constant. Regression for
the inspection completeness gap — every symbol in an ODE must resolve through
``context`` or ``functions``.
"""

import re

from psymple_ext import build_system, inspect_system

# model.x' = g*x, with g = 2*b (a function of input b, default 0.5).
FUNCTIONAL_MODEL = {
    "name": "model",
    "type": "cmp",
    "ports": {
        "input": [{"name": "b", "default": 0.5}],
        "output": [],
        "variable": ["x"],
    },
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
    "directed_wires": [
        {"source": "b", "destination": "rate.b"},
        {"source": "rate.g", "destination": "pop.g"},
    ],
    "variable_wires": [{"child_ports": ["pop.x"], "parent_port": "x"}],
}


def _identifiers(expression):
    return set(re.findall(r"[A-Za-z]+_?\d*", expression))


def test_functional_parameter_is_reported_and_resolvable():
    compiled = inspect_system(build_system(FUNCTIONAL_MODEL))

    resolvable = set(compiled["context"]) | set(compiled["functions"])
    variables = {ode["variable"] for ode in compiled["odes"]}

    # Every symbol in every ODE resolves through context or functions (or is a
    # variable). This is exactly what fails if functional parameters are dropped.
    for ode in compiled["odes"]:
        assert _identifiers(ode["expression"]) <= resolvable | variables

    # The functional parameter itself is exposed as an expression, and its own
    # dependency is a numeric context value.
    assert compiled["functions"]  # g = 2*b is present
    function_body = next(iter(compiled["functions"].values()))
    assert _identifiers(function_body) <= resolvable | variables
    assert "b" in compiled["context"]
    assert compiled["context"]["b"] == 0.5


def test_internal_couplings_are_not_reported():
    # The aggregation identity coupling (pop.x) is not reachable from the ODE, so it
    # must not clutter the parameter mappings.
    compiled = inspect_system(build_system(FUNCTIONAL_MODEL))
    assert "pop.x" not in compiled["parameter_mappings"].values()
