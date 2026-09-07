"""
Run a simulation of a compiled psymple ``System`` and return the result as plain
lists, ready for serialisation.

This wraps ``System.create_simulation(...).simulate(...)`` and reads the resulting
time series off ``sim.time`` and ``sim.variables``. The continuous solver uses
scipy's ``solve_ivp``; the discrete solver is a fixed-step Euler integrator that
needs a number of substeps per time unit, derived here from the step size ``dt``.

The two solvers produce different time grids, both inherited from psymple:

- continuous samples ``arange(0, t_end, 0.1)`` — step 0.1, **excluding** ``t_end``;
- discrete samples every substep from 0 through ``t_end`` **inclusive**, with
  ``n_steps = round(1 / dt)`` substeps per unit time. A ``dt`` that is not the
  reciprocal of an integer is rounded (e.g. ``dt=0.3`` becomes ``1/3``).

So the two series do not share an end sample, and a discrete ``dt`` may be
normalised. Callers that need a specific grid should post-process ``times``.
"""

DEFAULT_DISCRETE_STEPS = 10


def _discrete_steps(dt):
    """Substeps per time unit for the discrete integrator, from a step size."""
    if dt is None:
        return DEFAULT_DISCRETE_STEPS
    return max(1, round(1 / dt))


def run_simulation(
    system,
    initial_values,
    t_end,
    parameters=None,
    solver="continuous",
    dt=None,
):
    """Simulate ``system`` and return ``{"times": [...], "series": {var: [...]}}``.

    Args:
        system: a compiled ``System``.
        initial_values: ``{variable: value}`` initial conditions.
        t_end: positive integer end time (psymple's solvers require an integer).
        parameters: optional ``{parameter: value}`` overrides of the compiled context.
        solver: ``"continuous"`` (scipy ``solve_ivp``) or ``"discrete"`` (Euler).
        dt: step size for the discrete solver; ignored by the continuous solver.
    """
    if not system.compiled:
        system.compile()

    simulation = system.create_simulation(
        solver=solver,
        initial_values=initial_values,
        input_parameters=parameters or {},
    )

    t_end = int(t_end)
    if solver == "discrete":
        simulation.simulate(t_end=t_end, n_steps=_discrete_steps(dt))
    else:
        simulation.simulate(t_end=t_end)

    times = [float(t) for t in simulation.time.time_series]
    series = {
        str(symbol): [float(value) for value in variable.time_series]
        for symbol, variable in simulation.variables.items()
    }
    return {"times": times, "series": series}
