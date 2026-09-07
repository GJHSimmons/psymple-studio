import { describe, expect, it } from "vitest";

import { EngineError } from "../../engine";
import type {
  CompiledSystem,
  EngineInterface,
  SimulationResult,
} from "../../engine";
import { createModelStore } from "../useModelStore";

const COMPILED: CompiledSystem = {
  odes: [{ variable: "x", expression: "r_0*x" }],
  variableMappings: { x: "ecosystem.x" },
  parameterMappings: { r_0: "ecosystem.prey.r" },
  context: { r_0: 0.4 },
  functions: {},
  requiredInputs: [],
};

const SIMULATED: SimulationResult = {
  times: [0, 1],
  series: { x: [8, 8.3] },
};

function fakeEngine(overrides: Partial<EngineInterface> = {}): EngineInterface {
  return {
    compile: async () => COMPILED,
    simulate: async () => SIMULATED,
    ...overrides,
  };
}

describe("useModelStore", () => {
  it("starts idle with the seed tree and no results", () => {
    const store = createModelStore(fakeEngine());
    const s = store.getState();
    expect(s.compileStatus).toBe("idle");
    expect(s.compiled).toBeNull();
    expect(s.tree.name).toBe("ecosystem");
  });

  it("compile transitions idle -> loading -> ready and stores the system", async () => {
    const store = createModelStore(fakeEngine());
    const promise = store.getState().compile();
    expect(store.getState().compileStatus).toBe("loading");
    await promise;
    expect(store.getState().compileStatus).toBe("ready");
    expect(store.getState().compiled).toEqual(COMPILED);
    expect(store.getState().compileError).toBeNull();
  });

  it("surfaces a 422 detail as compileError and status error", async () => {
    const store = createModelStore(
      fakeEngine({
        compile: async () => {
          throw new EngineError(422, "Could not parse expression '2*'");
        },
      }),
    );
    await store.getState().compile();
    expect(store.getState().compileStatus).toBe("error");
    expect(store.getState().compileError).toBe(
      "Could not parse expression '2*'",
    );
    expect(store.getState().compiled).toBeNull();
  });

  it("simulate stores the result keyed by the returned times", async () => {
    const store = createModelStore(fakeEngine());
    await store
      .getState()
      .simulate({ initialValues: { x: 8 }, tEnd: 50, solver: "continuous" });
    const s = store.getState();
    expect(s.simulateStatus).toBe("ready");
    expect(s.simulation?.series.x).toHaveLength(s.simulation!.times.length);
  });

  it("setTree clears prior compile/simulate output", async () => {
    const store = createModelStore(fakeEngine());
    await store.getState().compile();
    expect(store.getState().compiled).not.toBeNull();

    store.getState().setTree({
      name: "empty",
      type: "cmp",
      ports: { input: [], output: [], variable: [] },
      assignments: [],
    });
    expect(store.getState().compiled).toBeNull();
    expect(store.getState().compileStatus).toBe("idle");
  });
});
