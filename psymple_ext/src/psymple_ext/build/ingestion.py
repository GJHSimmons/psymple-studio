"""
Build psymple ported objects and a ``System`` from a plain spec dictionary.

A spec is a nested dict describing a tree of ported objects:

    {
        "name": "ecosystem",
        "type": "cmp",                       # "ode" | "fn" | "cmp"
        "ports": {
            "input": [{"name": "r", "default": 0.4}, {"name": "K"}],
            "output": [],
            "variable": ["x", "y"],
        },
        "assignments": [{"target": "x", "expression": "r*x"}],
        "children": [ ...nested specs... ],           # cmp only
        "directed_wires": [{"source": "r", "destination": ["pop.r", "limit.r"]}],
        "variable_wires": [{"child_ports": ["pop.x", "limit.x"], "parent_port": "x"}],
    }

psymple already accepts tuple/dict forms for assignments, ports and wires, so this
is essentially a recursive translation of the spec vocabulary onto the constructor
keyword arguments of each ported object type.
"""

from psymple.build import (
    CompositePortedObject,
    FunctionalPortedObject,
    System,
    VariablePortedObject,
)

# Spec "type" -> ported object class. Mirrors the "ode"/"fn"/"cmp" vocabulary the
# builder UI uses; psymple's own short codes are "vpo"/"fpo"/"cpo".
PORTED_OBJECT_TYPES = {
    "ode": VariablePortedObject,
    "fn": FunctionalPortedObject,
    "cmp": CompositePortedObject,
}


def _input_ports(ports):
    """Translate spec input ports into psymple ``add_input_ports`` entries.

    An entry with a ``default`` becomes ``{"name", "default_value"}``; otherwise
    just the bare name string.
    """
    entries = []
    for port in ports:
        default = port.get("default")
        if default is None:
            entries.append(port["name"])
        else:
            entries.append({"name": port["name"], "default_value": default})
    return entries


def _assignments(assignments):
    # psymple accepts (target, expression) tuples for both differential (ODE) and
    # functional assignments.
    return [(a["target"], a["expression"]) for a in assignments]


def _directed_wires(wires):
    # psymple accepts (source, destination); destination may be a str or a list.
    return [(w["source"], w["destination"]) for w in wires]


def _variable_wires(wires):
    # psymple accepts (child_ports, parent_port).
    return [(w["child_ports"], w["parent_port"]) for w in wires]


def build_ported_object(spec):
    """Recursively build a ``PortedObject`` from a spec dict."""
    type_ = spec["type"]
    try:
        cls = PORTED_OBJECT_TYPES[type_]
    except KeyError:
        raise ValueError(
            f"Unknown ported object type {type_!r}; expected one of "
            f"{sorted(PORTED_OBJECT_TYPES)}."
        )
    name = spec["name"]
    ports = spec.get("ports", {})
    input_ports = _input_ports(ports.get("input", []))

    if type_ == "cmp":
        children = [build_ported_object(child) for child in spec.get("children", [])]
        return cls(
            name=name,
            children=children,
            input_ports=input_ports,
            output_ports=list(ports.get("output", [])),
            variable_ports=list(ports.get("variable", [])),
            directed_wires=_directed_wires(spec.get("directed_wires", [])),
            variable_wires=_variable_wires(spec.get("variable_wires", [])),
        )
    if type_ == "ode":
        return cls(
            name=name,
            input_ports=input_ports,
            variable_ports=list(ports.get("variable", [])),
            assignments=_assignments(spec.get("assignments", [])),
        )
    # type_ == "fn"
    return cls(
        name=name,
        input_ports=input_ports,
        assignments=_assignments(spec.get("assignments", [])),
    )


def build_system(spec, compile=True):
    """Build a compiled ``System`` from a root spec dict.

    Args:
        spec: the root ported object spec.
        compile: if ``True`` (default), the system is compiled on construction.
    """
    root = build_ported_object(spec)
    return System(root, compile=compile)
