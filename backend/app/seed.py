"""
The seed Lotka-Volterra tree in the frontend's camelCase wire shape, matching
frontend/src/engine/seedModel.ts. Used by the API tests and handy for a manual
`curl` against a running server.
"""

SEED_TREE = {
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
            "assignments": [],
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
            "directedWires": [
                {"source": "r", "destination": ["pop.r", "limit.r"]},
                {"source": "K", "destination": "limit.K"},
            ],
            "variableWires": [{"childPorts": ["pop.x", "limit.x"], "parentPort": "x"}],
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
                "input": [
                    {"name": "r_1", "default": -0.2},
                    {"name": "r_2", "default": 0.1},
                ],
                "output": [],
                "variable": ["x", "y"],
            },
            "assignments": [
                {"target": "x", "expression": "r_1*x*y"},
                {"target": "y", "expression": "r_2*x*y"},
            ],
        },
    ],
    "variableWires": [
        {"childPorts": ["prey.x", "pred-prey.x"], "parentPort": "x"},
        {"childPorts": ["pred.x", "pred-prey.y"], "parentPort": "y"},
    ],
}
