import { describe, expect, it } from "vitest";
import { seedEcosystem } from "../../seedModel";
import { compile } from "../compile";
import { simulate } from "../simulate";

describe("simulate(compile(seedEcosystem))", () => {
  const system = compile(seedEcosystem);

  it("produces a time series of matching length for every variable", () => {
    const result = simulate(system, {
      initialValues: { x: 8, y: 3 },
      tEnd: 10,
      solver: "discrete",
      dt: 1,
    });

    expect(result.times).toHaveLength(11);
    expect(result.series.x).toHaveLength(11);
    expect(result.series.y).toHaveLength(11);
    expect(result.times[0]).toBe(0);
    expect(result.times[10]).toBeCloseTo(10);
  });

  it("takes one Euler step matching a hand-computed derivative", () => {
    const result = simulate(system, {
      initialValues: { x: 8, y: 3 },
      tEnd: 1,
      solver: "discrete",
      dt: 1,
    });

    const dxdt0 = 0.4 * 8 - (0.4 / 10) * 8 ** 2 + -0.2 * 8 * 3;
    const dydt0 = -0.2 * 3 + 0.1 * 8 * 3;

    expect(result.series.x[1]).toBeCloseTo(8 + dxdt0);
    expect(result.series.y[1]).toBeCloseTo(3 + dydt0);
  });

  it("respects parameter overrides", () => {
    const withoutPredation = simulate(system, {
      initialValues: { x: 8, y: 0 },
      parameters: { pred_prey_r_1: 0, pred_prey_r_2: 0 },
      tEnd: 1,
      solver: "discrete",
      dt: 1,
    });
    const expectedDx = 0.4 * 8 - (0.4 / 10) * 8 ** 2;
    expect(withoutPredation.series.x[1]).toBeCloseTo(8 + expectedDx);
    expect(withoutPredation.series.y[1]).toBeCloseTo(0);
  });

  it("'continuous' and 'discrete' both run without a real adaptive solver, differing only in step size", () => {
    const continuous = simulate(system, { initialValues: { x: 8, y: 3 }, tEnd: 2, solver: "continuous" });
    const discrete = simulate(system, { initialValues: { x: 8, y: 3 }, tEnd: 2, solver: "discrete" });

    expect(continuous.times.length).toBeGreaterThan(discrete.times.length);
    expect(continuous.times.at(-1)).toBeCloseTo(2);
    expect(discrete.times.at(-1)).toBeCloseTo(2);
  });
});
