/**
 * The EngineInterface contract. The mock TypeScript engine (`engine/mock/`)
 * and the future psymple-backed engine (Wave 3) both implement this
 * interface unchanged — UI code is written against these types only.
 *
 * The data model mirrors psymple's own vocabulary directly:
 *   - `ode` <-> VariablePortedObject
 *   - `fn`  <-> FunctionalPortedObject
 *   - `cmp` <-> CompositePortedObject
 * so that a real compiler's output fits these shapes without translation.
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

/** The flattened, simulable output of compiling a PortedObjectNode tree. */
export interface CompiledSystem {
  odes: Array<{ variable: string; expression: string }>;
  /** Flattened variable name -> originating dotted path. */
  variableMappings: Record<string, string>;
  /** Flattened parameter name -> originating dotted path. */
  parameterMappings: Record<string, string>;
  /** Resolved numeric value for every parameter symbol appearing in `odes`. */
  context: Record<string, number>;
}

export interface SimulateOptions {
  initialValues: Record<string, number>;
  /** Overrides for `CompiledSystem.context`. */
  parameters?: Record<string, number>;
  tEnd: number;
  solver: "continuous" | "discrete";
  dt?: number;
}

export interface SimulationResult {
  times: number[];
  series: Record<string, number[]>;
}

export interface EngineInterface {
  compile(tree: PortedObjectNode): CompiledSystem;
  simulate(system: CompiledSystem, options: SimulateOptions): SimulationResult;
}
