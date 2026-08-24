/**
 * Mock simulation: a fixed-step forward-Euler integrator. Real psymple's
 * "continuous" solver wraps an adaptive solve_ivp; the mock has no adaptive
 * solver, so both `solver` values run Euler and differ only in step size —
 * see decision #14 for why the toggle is still exposed.
 */

import type { CompiledSystem, SimulateOptions, SimulationResult } from "../types";
import { evaluate, parseExpr } from "./expr";

const DEFAULT_STEP_COUNT: Record<SimulateOptions["solver"], number> = {
  continuous: 1000,
  discrete: 50,
};

export function simulate(system: CompiledSystem, options: SimulateOptions): SimulationResult {
  const { initialValues, parameters, tEnd, solver, dt } = options;

  const odes = system.odes.map((ode) => ({ variable: ode.variable, ast: parseExpr(ode.expression) }));
  const context = { ...system.context, ...parameters };

  const stepSize = dt ?? tEnd / DEFAULT_STEP_COUNT[solver];
  const stepCount = Math.max(1, Math.round(tEnd / stepSize));

  const state: Record<string, number> = {};
  const series: Record<string, number[]> = {};
  for (const { variable } of odes) {
    const initial = initialValues[variable];
    if (initial === undefined) {
      throw new Error(`Missing initial value for variable '${variable}'`);
    }
    state[variable] = initial;
    series[variable] = [initial];
  }

  const times: number[] = [0];
  for (let step = 0; step < stepCount; step++) {
    const bindings = { ...context, ...state };
    const derivatives: Record<string, number> = {};
    for (const { variable, ast } of odes) {
      derivatives[variable] = evaluate(ast, bindings);
    }
    for (const { variable } of odes) {
      state[variable] += stepSize * derivatives[variable];
      series[variable].push(state[variable]);
    }
    times.push(times[times.length - 1] + stepSize);
  }

  return { times, series };
}
