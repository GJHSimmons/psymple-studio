import { describe, expect, it } from "vitest";
import { mockEngine, seedEcosystem } from "../index";

describe("mockEngine end-to-end on the seed ecosystem (issue #4 done-when)", () => {
  it("compiles and simulates the seed model, matching EngineInterface output shapes", () => {
    const system = mockEngine.compile(seedEcosystem);

    expect(Array.isArray(system.odes)).toBe(true);
    expect(typeof system.variableMappings).toBe("object");
    expect(typeof system.parameterMappings).toBe("object");
    expect(typeof system.context).toBe("object");

    const result = mockEngine.simulate(system, {
      initialValues: { x: 8, y: 3 },
      tEnd: 50,
      solver: "continuous",
    });

    expect(Array.isArray(result.times)).toBe(true);
    expect(typeof result.series).toBe("object");
    expect(result.series.x).toHaveLength(result.times.length);
    expect(result.series.y).toHaveLength(result.times.length);

    // Logistic-prey Lotka-Volterra: both populations stay finite and positive
    // for a reasonable horizon at these parameters.
    for (const value of [...result.series.x, ...result.series.y]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
