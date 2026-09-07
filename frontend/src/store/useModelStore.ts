/**
 * The model/engine store: it holds the ported-object tree the user is editing
 * and drives compile/simulate as backend round-trips (ARCH #17). Kept separate
 * from `useAppStore` (nav-rail chrome) so the Builder and Screens streams can
 * consume the model without pulling in UI-shell state.
 *
 * `simulate` is stateless (#23): the store holds the tree and passes it to the
 * engine each call — there is no compiled-system handle to cache and invalidate.
 */

import { create } from "zustand";

import {
  EngineError,
  engine as defaultEngine,
  seedEcosystem,
} from "../engine";
import type {
  CompiledSystem,
  EngineInterface,
  PortedObjectNode,
  SimulateOptions,
  SimulationResult,
} from "../engine";

/** Lifecycle of an async engine call, for loading/error UI. */
export type RequestStatus = "idle" | "loading" | "ready" | "error";

interface ModelState {
  /** The tree being edited — the single source the engine compiles/simulates. */
  tree: PortedObjectNode;

  compileStatus: RequestStatus;
  compiled: CompiledSystem | null;
  /** Backend `detail` for a failed compile (e.g. a psymple parse error), else null. */
  compileError: string | null;

  simulateStatus: RequestStatus;
  simulation: SimulationResult | null;
  simulateError: string | null;

  compile: () => Promise<void>;
  simulate: (options: SimulateOptions) => Promise<void>;
  setTree: (tree: PortedObjectNode) => void;
}

/** Turn any thrown value into a user-facing message, preferring the 422 detail. */
function messageOf(error: unknown): string {
  if (error instanceof EngineError) return error.detail;
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

/**
 * Factory so tests can inject a fake engine. The app uses the default HTTP
 * engine bound to the configured base URL.
 */
export function createModelStore(engine: EngineInterface = defaultEngine) {
  return create<ModelState>((set, get) => ({
    tree: seedEcosystem,

    compileStatus: "idle",
    compiled: null,
    compileError: null,

    simulateStatus: "idle",
    simulation: null,
    simulateError: null,

    async compile() {
      set({ compileStatus: "loading", compileError: null });
      try {
        const compiled = await engine.compile(get().tree);
        set({ compileStatus: "ready", compiled });
      } catch (error) {
        set({ compileStatus: "error", compileError: messageOf(error) });
      }
    },

    async simulate(options) {
      set({ simulateStatus: "loading", simulateError: null });
      try {
        const simulation = await engine.simulate(get().tree, options);
        set({ simulateStatus: "ready", simulation });
      } catch (error) {
        set({ simulateStatus: "error", simulateError: messageOf(error) });
      }
    },

    setTree(tree) {
      // Editing the tree invalidates prior compile/simulate output.
      set({
        tree,
        compileStatus: "idle",
        compiled: null,
        compileError: null,
        simulateStatus: "idle",
        simulation: null,
        simulateError: null,
      });
    },
  }));
}

export const useModelStore = createModelStore();
