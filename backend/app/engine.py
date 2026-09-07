"""
Thin adapter between the API layer and ``psymple_ext``.

Stateless by design (ARCH #17, Fork 1): ``/simulate`` re-ingests and compiles the
tree rather than holding server-side session state, so both entry points start
from a plain spec dict.
"""

from psymple_ext import build_system, inspect_system, run_simulation


def compile_spec(spec: dict) -> dict:
    """Ingest and compile a tree spec, returning its structured inspection."""
    system = build_system(spec)
    return inspect_system(system)


def simulate_spec(
    spec: dict,
    initial_values: dict,
    t_end: int,
    parameters: dict | None = None,
    solver: str = "continuous",
    dt: float | None = None,
) -> dict:
    """Ingest, compile and simulate a tree spec, returning ``{times, series}``."""
    system = build_system(spec)
    return run_simulation(
        system,
        initial_values=initial_values,
        t_end=t_end,
        parameters=parameters,
        solver=solver,
        dt=dt,
    )
