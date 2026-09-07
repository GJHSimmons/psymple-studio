/**
 * The one `EngineInterface` implementation: an HTTP client over the FastAPI
 * backend that runs real psymple (ARCH #17). It carries the ported-object tree
 * to `/compile` and `/simulate` and returns their typed output unchanged — it
 * does no modelling maths itself.
 *
 * Base URL: defaults to `/api`, which the Vite dev server proxies to the backend
 * origin (uvicorn `:8000`). Override with `VITE_API_BASE_URL` for other deploys.
 */

import type {
  CompiledSystem,
  EngineInterface,
  PortedObjectNode,
  SimulateOptions,
  SimulationResult,
} from "./types";

const DEFAULT_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api";

/**
 * A compile/simulate failure the UI can surface. `status` is the HTTP status
 * (422 for an invalid model), and `detail` is the backend's human-readable
 * `detail` message — a psymple parsing/wiring error the user can act on.
 */
export class EngineError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "EngineError";
    this.status = status;
    this.detail = detail;
  }
}

/** Read FastAPI's `{ detail }` body, falling back to the status text. */
async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string" && body.detail.length > 0) {
      return body.detail;
    }
  } catch {
    // Non-JSON body (e.g. a proxy/gateway error page): fall through.
  }
  return response.statusText || `Request failed (${response.status})`;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Network failure / backend unreachable — no HTTP status to report.
    throw new EngineError(
      0,
      "Cannot reach the backend. Is the psymple service running?",
    );
  }

  if (!response.ok) {
    throw new EngineError(response.status, await readErrorDetail(response));
  }
  return (await response.json()) as T;
}

/**
 * Build an `EngineInterface` bound to a backend base URL. Trailing slashes on
 * `baseUrl` are tolerated.
 */
export function createHttpEngine(
  baseUrl: string = DEFAULT_BASE_URL,
): EngineInterface {
  const root = baseUrl.replace(/\/+$/, "");

  return {
    compile(tree: PortedObjectNode): Promise<CompiledSystem> {
      return postJson<CompiledSystem>(`${root}/compile`, { tree });
    },

    simulate(
      tree: PortedObjectNode,
      options: SimulateOptions,
    ): Promise<SimulationResult> {
      // Stateless (#23): send the tree with the options; the backend re-ingests
      // and compiles per call. Field names are the camelCase wire contract (#24);
      // `undefined` options serialise away and take the backend defaults.
      return postJson<SimulationResult>(`${root}/simulate`, {
        tree,
        initialValues: options.initialValues,
        parameters: options.parameters,
        tEnd: options.tEnd,
        solver: options.solver,
        dt: options.dt,
      });
    },
  };
}

/** The default engine, bound to the configured base URL. */
export const engine: EngineInterface = createHttpEngine();
