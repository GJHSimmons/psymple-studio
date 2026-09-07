"""
Inspect a compiled psymple ``System`` as structured data.

psymple today exposes a compiled system through ``print(S)`` plus the raw
``S.variables`` / ``S.parameters`` containers, and its own docs call system
inspection "not fully developed". This module turns a compiled system into a plain
dict suitable for serialisation:

    {
        "odes": [{"variable": "x", "expression": "a_3*x - a_3*x**2/a_6 + a_9*x*y"}, ...],
        "variable_mappings":  {"x": "x", "y": "y"},          # short -> full name
        "parameter_mappings": {"a_3": "prey.r", "a_6": "prey.K", ...},
        "context": {"a_3": 0.4, "a_6": 10.0, ...},           # short -> numeric value
        "functions": {"a_2": "2*a_1", ...},                  # short -> expression (short)
        "required_inputs": [],                               # params with no value yet
    }

Every parameter symbol appearing in an ODE resolves through ``context`` (numeric)
or ``functions`` (a symbolic expression over other parameters/variables) — the two
together let a caller substitute an ODE down to numbers. A parameter that is really
a function of the model's inputs (produced by a ``FunctionalPortedObject``) lands in
``functions``; a constant lands in ``context``.

Only parameters reachable from the ODEs (directly or through a function body) are
reported, so internal aggregation couplings psymple keeps in ``system.parameters``
do not clutter the output.

Long, hierarchical symbols (e.g. ``prey.pop.r``) are replaced with short readable
symbols (``x_i`` for variables, ``a_i`` for parameters), keeping any symbol already
exposed at the surface of the model. Unlike ``System.get_readable_symbols``, the
short indices here are assigned deterministically (sorted by full name), so
inspecting the same system twice yields the same labels.
"""

from psymple.build import HIERARCHY_SEPARATOR
from sympy import Symbol


def _short_symbols(system):
    """Return ``(vars_map, pars_map)``: full ``Symbol`` -> short ``Symbol``.

    Surface symbols (those without a hierarchy separator) are kept as-is. Nested
    symbols are indexed ``x_0, x_1, ...`` / ``a_0, a_1, ...`` in sorted name order.
    The time symbol is mapped to ``t``.
    """
    def build_map(symbols, prefix):
        surface = [s for s in symbols if HIERARCHY_SEPARATOR not in s.name]
        nested = sorted(
            (s for s in symbols if HIERARCHY_SEPARATOR in s.name), key=lambda s: s.name
        )
        mapping = {s: s for s in surface}
        for i, s in enumerate(nested):
            mapping[s] = Symbol(f"{prefix}_{i}")
        return mapping

    vars_map = build_map(system.variables.keys(), "x")
    vars_map[system.time.symbol] = Symbol("t")
    pars_map = build_map(system.parameters.keys(), "a")
    return vars_map, pars_map


def _numeric_value(expression):
    """Return ``expression`` as a float if it is a pure number, else ``None``."""
    try:
        return float(expression)
    except (TypeError, ValueError):
        return None


def _parameter_dependencies(parameter, parameter_symbols):
    """Parameter symbols appearing in a parameter's own expression."""
    expression = parameter.expression
    try:
        return expression.free_symbols & parameter_symbols
    except AttributeError:  # a required input has no expression yet
        return set()


def inspect_system(system):
    """Return a structured, serialisable view of a compiled ``System``."""
    if not system.compiled:
        system.compile()

    vars_map, pars_map = _short_symbols(system)
    substitutions = {**vars_map, **pars_map}
    parameter_symbols = set(system.parameters.keys())

    odes = []
    reachable = set()  # parameter symbols the ODEs depend on (transitively)
    for symbol, variable in system.variables.items():
        expression = variable.update_rule.expression
        reachable |= expression.free_symbols & parameter_symbols
        odes.append(
            {
                "variable": str(vars_map[symbol]),
                "expression": str(expression.subs(substitutions)),
            }
        )

    # A parameter may itself be a function of other parameters; pull those in too so
    # every symbol reachable from an ODE has an entry in context or functions.
    frontier = set(reachable)
    while frontier:
        symbol = frontier.pop()
        dependencies = _parameter_dependencies(
            system.parameters[symbol], parameter_symbols
        )
        new = dependencies - reachable
        reachable |= new
        frontier |= new

    variable_mappings = {str(vars_map[s]): str(s) for s in system.variables.keys()}
    parameter_mappings = {str(pars_map[s]): str(s) for s in reachable}

    context = {}
    functions = {}
    required_inputs = []
    for symbol in reachable:
        parameter = system.parameters[symbol]
        short = str(pars_map[symbol])
        if parameter.type == "required":
            required_inputs.append(short)
            continue
        value = _numeric_value(parameter.expression)
        if value is not None:
            context[short] = value
        else:
            functions[short] = str(parameter.expression.subs(substitutions))

    return {
        "odes": odes,
        "variable_mappings": variable_mappings,
        "parameter_mappings": parameter_mappings,
        "context": context,
        "functions": functions,
        "required_inputs": required_inputs,
    }
