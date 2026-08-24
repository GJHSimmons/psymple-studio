import { describe, expect, it } from "vitest";
import { seedEcosystem } from "../../seedModel";
import { evaluate, parseExpr } from "../expr";
import { compile } from "../compile";

describe("compile(seedEcosystem)", () => {
  const system = compile(seedEcosystem);

  it("produces one ODE per exposed root variable", () => {
    expect(system.odes.map((o) => o.variable).sort()).toEqual(["x", "y"]);
  });

  it("resolves every parameter default into context", () => {
    expect(system.context).toEqual({
      prey_r: 0.4,
      prey_K: 10,
      pred_r: -0.2,
      pred_prey_r_1: -0.2,
      pred_prey_r_2: 0.1,
    });
  });

  it("maps flattened names back to their originating dotted paths", () => {
    expect(system.parameterMappings.prey_r).toBe("prey.r");
    expect(system.parameterMappings.prey_K).toBe("prey.K");
    expect(system.variableMappings.x).toBe("ecosystem.x");
    expect(system.variableMappings.y).toBe("ecosystem.y");
  });

  it("flattens to the expected Lotka-Volterra-with-logistic-prey equations", () => {
    const dx = system.odes.find((o) => o.variable === "x")!;
    const dy = system.odes.find((o) => o.variable === "y")!;

    const bindings = { ...system.context, x: 8, y: 3 };
    const dxdt = evaluate(parseExpr(dx.expression), bindings);
    const dydt = evaluate(parseExpr(dy.expression), bindings);

    const expectedDx = 0.4 * 8 - (0.4 / 10) * 8 ** 2 + -0.2 * 8 * 3;
    const expectedDy = -0.2 * 3 + 0.1 * 8 * 3;

    expect(dxdt).toBeCloseTo(expectedDx);
    expect(dydt).toBeCloseTo(expectedDy);
  });
});
