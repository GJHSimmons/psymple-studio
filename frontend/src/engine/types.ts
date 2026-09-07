/**
 * The EngineInterface contract. Its single implementation is an HTTP client
 * (`httpEngine.ts`) that calls the FastAPI backend running real psymple
 * (ARCH #17). UI code is written against these types only, never against the
 * wire shapes directly.
 *
 * The data model mirrors psymple's own vocabulary directly:
 *   - `ode` <-> VariablePortedObject
 *   - `fn`  <-> FunctionalPortedObject
 *   - `cmp` <-> CompositePortedObject
 * so the compiler's output fits these shapes without translation.
 *
 * The wire is camelCase (#24); these types are the camelCase side and map
 * onto the backend DTOs (`backend/app/dtos.py`) field-for-field.
 */

export type PortedObjectType = "ode" | "fn" | "cmp";

export interface InputPort {
  name: string;
  /** Default numeric value, used when no wire supplies this input. */
  default?: number;
}

export interface PortSet {
  input: InputPort[];
  output: string[];
  variable: string[];
}

/** A single `target = expression` assignment (a variable's ODE, or a function's output). */
export interface Assignment {
  target: string;
  expression: string;
}

/**
 * Functional substitution wire: source -> destination(s).
 * Endpoints are either a local port name or "child.port" dot notation.
 */
export interface DirectedWire {
  source: string;
  destination: string | string[];
}

/**
 * Variable aggregation wire: [child_ports] -> parent_port.
 * The parent variable's ODE is the sum of the named child variables' ODEs.
 */
export interface VariableWire {
  childPorts: string[];
  parentPort: string;
}

export interface PortedObjectNode {
  name: string;
  type: PortedObjectType;
  ports: PortSet;
  assignments: Assignment[];
  children?: PortedObjectNode[];
  directedWires?: DirectedWire[];
  variableWires?: VariableWire[];
}

/** A single flattened ODE: `d(variable)/dt = expression`. */
export interface Ode {
  variable: string;
  expression: string;
}

/**
 * The flattened, simulable output of compiling a PortedObjectNode tree —
 * real psymple output (`backend/app/dtos.py::CompiledSystem`), never UI-derived.
 *
 * Every symbol appearing in an `odes` expression resolves through exactly one of
 * `context` (a resolved number) or `functions` (a symbolic expression over other
 * symbols), so a reader can substitute recursively to a numeric or symbolic form.
 * Invariant: `parameterMappings` keys ⊇ `context` ∪ `functions` ∪ `requiredInputs`.
 */
export interface CompiledSystem {
  odes: Ode[];
  /** Flattened variable symbol -> originating dotted path. */
  variableMappings: Record<string, string>;
  /** Flattened parameter symbol -> originating dotted path. */
  parameterMappings: Record<string, string>;
  /** Resolved numeric value for every constant parameter symbol in `odes`. */
  context: Record<string, number>;
  /**
   * Parameters that are functions of the model's inputs rather than constants (#25):
   * short parameter symbol -> expression written in short symbols over other
   * parameters/variables. The frontend substitutes these recursively.
   */
  functions: Record<string, string>;
  /**
   * Symbols reachable from the ODEs that have neither a resolved value in
   * `context` nor a definition in `functions` — the inputs a simulation must supply.
   */
  requiredInputs: string[];
}

export interface SimulateOptions {
  /** Initial value for each variable symbol integrated. */
  initialValues: Record<string, number>;
  /** Overrides for resolved parameter values (`CompiledSystem.context`). */
  parameters?: Record<string, number>;
  tEnd: number;
  solver: "continuous" | "discrete";
  /** Step size; required by the discrete (forward Euler) solver. */
  dt?: number;
}

/**
 * A simulation time series — real psymple output. Plot `series` against the
 * returned `times`; do not assume a fixed grid (the continuous solver excludes
 * `tEnd`, the discrete solver includes it).
 */
export interface SimulationResult {
  times: number[];
  series: Record<string, number[]>;
}

/**
 * The engine seam. Compilation and simulation are backend round-trips, so both
 * are async. `simulate` is stateless (#23): it takes the tree, not a compiled
 * handle — the client holds the tree and the backend re-ingests/compiles per call.
 */
export interface EngineInterface {
  compile(tree: PortedObjectNode): Promise<CompiledSystem>;
  simulate(
    tree: PortedObjectNode,
    options: SimulateOptions,
  ): Promise<SimulationResult>;
}
