import { afterEach, describe, expect, it, vi } from "vitest";

import { EngineError, createHttpEngine, seedEcosystem } from "../index";
import type { CompiledSystem, SimulationResult } from "../index";

/**
 * Unit tests for the HTTP engine client. `fetch` is mocked to the documented
 * wire contract (`backend/app/dtos.py`) — these prove the client shapes requests,
 * parses the typed responses, and surfaces the 422 `detail`, without a live
 * backend. The real round-trip is verified against the running service separately.
 */

const COMPILE_RESPONSE: CompiledSystem = {
  odes: [
    { variable: "x_0", expression: "r_0*x_0 - r_0/K_0*x_0**2 + r_1*x_0*y_0" },
    { variable: "y_0", expression: "r_2*x_0*y_0 + r_3*y_0" },
  ],
  variableMappings: { x_0: "ecosystem.x", y_0: "ecosystem.y" },
  parameterMappings: {
    r_0: "ecosystem.prey.r",
    K_0: "ecosystem.prey.K",
    r_1: "ecosystem.pred-prey.r_1",
    r_2: "ecosystem.pred-prey.r_2",
    r_3: "ecosystem.pred.r",
  },
  context: { r_0: 0.4, K_0: 10, r_1: -0.2, r_2: 0.1, r_3: -0.2 },
  functions: {},
  requiredInputs: [],
};

const SIMULATE_RESPONSE: SimulationResult = {
  times: [0, 1, 2],
  series: { x_0: [8, 8.4, 8.7], y_0: [3, 2.9, 2.8] },
};

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Unprocessable Entity",
    json: async () => body,
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("httpEngine", () => {
  it("POSTs the tree to /compile and returns the typed CompiledSystem", async () => {
    const fetchMock = mockFetchOnce(COMPILE_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    const engine = createHttpEngine("/api");
    const system = await engine.compile(seedEcosystem);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/compile");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({ tree: seedEcosystem });

    expect(system).toEqual(COMPILE_RESPONSE);
    // #25: functions + requiredInputs are part of the contract, even when empty.
    expect(system.functions).toEqual({});
    expect(system.requiredInputs).toEqual([]);
  });

  it("POSTs the tree + camelCase options to /simulate (stateless, #23)", async () => {
    const fetchMock = mockFetchOnce(SIMULATE_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    const engine = createHttpEngine("/api");
    const result = await engine.simulate(seedEcosystem, {
      initialValues: { x_0: 8, y_0: 3 },
      tEnd: 50,
      solver: "continuous",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/simulate");
    const sent = JSON.parse(options.body);
    // The tree travels with the options — no compiled-system handle (#23).
    expect(sent.tree).toEqual(seedEcosystem);
    expect(sent.initialValues).toEqual({ x_0: 8, y_0: 3 });
    expect(sent.tEnd).toBe(50);
    expect(sent.solver).toBe("continuous");

    expect(result.times).toEqual(SIMULATE_RESPONSE.times);
    expect(result.series.x_0).toHaveLength(result.times.length);
  });

  it("trims a trailing slash on the base URL", async () => {
    const fetchMock = mockFetchOnce(COMPILE_RESPONSE);
    vi.stubGlobal("fetch", fetchMock);

    await createHttpEngine("http://localhost:8000/").compile(seedEcosystem);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/compile");
  });

  it("raises EngineError carrying the 422 detail from an invalid model", async () => {
    const fetchMock = mockFetchOnce(
      { detail: "Could not parse expression '2*'" },
      { status: 422 },
    );
    vi.stubGlobal("fetch", fetchMock);

    const engine = createHttpEngine("/api");
    await expect(engine.compile(seedEcosystem)).rejects.toMatchObject({
      name: "EngineError",
      status: 422,
      detail: "Could not parse expression '2*'",
    });
  });

  it("raises EngineError when the backend is unreachable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    const engine = createHttpEngine("/api");
    const error = await engine.compile(seedEcosystem).catch((e) => e);
    expect(error).toBeInstanceOf(EngineError);
    expect(error.status).toBe(0);
  });
});
