/**
 * Mock compilation: flattens a PortedObjectNode tree into a CompiledSystem
 * by the same two mechanisms psymple's own compiler uses (see the
 * user_guide/compilation docs) — directed wires as formal substitution,
 * variable wires as aggregation — followed by a renaming pass that gives
 * every remaining symbol a unique flattened name.
 *
 * Scope is deliberately limited to what the seed model and Wave 1-2
 * builder-created trees need: composite-level directed wires whose source
 * is the composite's own port, and variable wires that fully aggregate
 * their child ports. See decision #15.
 */

import type { CompiledSystem, DirectedWire, PortedObjectNode, VariableWire } from "../types";
import { type ExprNode, parseExpr, renameSymbols, toExprString } from "./expr";

interface Pool {
  equations: Map<string, ExprNode>;
  params: Map<string, number | undefined>;
}

function qualify(path: string, name: string): string {
  return path === "" ? name : `${path}.${name}`;
}

function qualifyLeaf(node: PortedObjectNode, path: string): Pool {
  const ownNames = new Set<string>([...node.ports.input.map((p) => p.name), ...node.ports.variable]);
  const renames = new Map<string, string>();
  for (const name of ownNames) renames.set(name, qualify(path, name));

  const equations = new Map<string, ExprNode>();
  for (const assignment of node.assignments) {
    const ast = renameSymbols(parseExpr(assignment.expression), renames);
    equations.set(qualify(path, assignment.target), ast);
  }

  const params = new Map<string, number | undefined>();
  for (const port of node.ports.input) {
    params.set(qualify(path, port.name), port.default);
  }

  return { equations, params };
}

function mergePools(pools: Pool[]): Pool {
  const equations = new Map<string, ExprNode>();
  const params = new Map<string, number | undefined>();
  for (const pool of pools) {
    for (const [key, value] of pool.equations) equations.set(key, value);
    for (const [key, value] of pool.params) params.set(key, value);
  }
  return { equations, params };
}

/** Directed wires perform functional substitution: destination symbols become the source symbol. */
function applyDirectedWires(pool: Pool, path: string, wires: DirectedWire[]): void {
  for (const wire of wires) {
    const destinations = Array.isArray(wire.destination) ? wire.destination : [wire.destination];
    const qSource = qualify(path, wire.source);
    const renames = new Map<string, string>();
    for (const destination of destinations) {
      renames.set(qualify(path, destination), qSource);
    }
    for (const [key, expr] of pool.equations) {
      pool.equations.set(key, renameSymbols(expr, renames));
    }
    for (const destQualified of renames.keys()) {
      pool.params.delete(destQualified);
    }
  }
}

/**
 * Variable wires aggregate: the parent variable's equation is the sum of
 * its child variables' equations, and every reference to a child symbol
 * (including cross-references within the same wire batch) is renamed to
 * the parent symbol.
 */
function applyVariableWires(pool: Pool, path: string, wires: VariableWire[]): void {
  const renames = new Map<string, string>();
  const aggregated: Array<{ parent: string; expr: ExprNode }> = [];

  for (const wire of wires) {
    const qParent = qualify(path, wire.parentPort);
    const qChildren = wire.childPorts.map((cp) => qualify(path, cp));
    const exprs = qChildren.map((qc) => {
      const expr = pool.equations.get(qc);
      if (!expr) throw new Error(`Variable wire references unknown port '${qc}'`);
      return expr;
    });
    const summed = exprs.reduce((a, b) => ({ kind: "bin", op: "+", left: a, right: b }) as ExprNode);
    aggregated.push({ parent: qParent, expr: summed });
    for (const qc of qChildren) {
      pool.equations.delete(qc);
      renames.set(qc, qParent);
    }
  }

  for (const { parent, expr } of aggregated) {
    pool.equations.set(parent, expr);
  }
  for (const [key, expr] of pool.equations) {
    pool.equations.set(key, renameSymbols(expr, renames));
  }
}

function compileNode(node: PortedObjectNode, path: string): Pool {
  if (node.type !== "cmp") {
    return qualifyLeaf(node, path);
  }

  const children = node.children ?? [];
  const childPools = children.map((child) => compileNode(child, qualify(path, child.name)));
  const pool = mergePools(childPools);

  applyDirectedWires(pool, path, node.directedWires ?? []);
  applyVariableWires(pool, path, node.variableWires ?? []);

  // This composite's own declared input ports are authoritative for their
  // default now that any wiring that referenced them has been applied.
  for (const port of node.ports.input) {
    pool.params.set(qualify(path, port.name), port.default);
  }

  return pool;
}

export function compile(tree: PortedObjectNode): CompiledSystem {
  const pool = compileNode(tree, "");

  const parameterMappings: Record<string, string> = {};
  const flattenedParamName = new Map<string, string>();
  for (const originalPath of pool.params.keys()) {
    // Flattened names are re-parsed as expression symbols later (in
    // simulate.ts), so they must be valid identifier tokens — sanitize
    // every non-identifier character (dots, and any punctuation a ported
    // object's own name might contain, e.g. "pred-prey"), not just dots.
    const base = originalPath.replace(/[^A-Za-z0-9_]/g, "_");
    let flattened = base;
    let suffix = 2;
    while (Object.prototype.hasOwnProperty.call(parameterMappings, flattened)) {
      flattened = `${base}_${suffix++}`;
    }
    parameterMappings[flattened] = originalPath;
    flattenedParamName.set(originalPath, flattened);
  }

  const variableMappings: Record<string, string> = {};
  for (const variableName of tree.ports.variable) {
    variableMappings[variableName] = qualify(tree.name, variableName);
  }

  const odes = tree.ports.variable.map((variableName) => {
    const expr = pool.equations.get(variableName);
    if (!expr) {
      throw new Error(`Root variable port '${variableName}' has no equation after compilation`);
    }
    const flattenedExpr = renameSymbols(expr, flattenedParamName);
    return { variable: variableName, expression: toExprString(flattenedExpr) };
  });

  const context: Record<string, number> = {};
  for (const [originalPath, defaultValue] of pool.params) {
    if (defaultValue === undefined) {
      throw new Error(`Unresolved parameter '${originalPath}': no default value reaches this port`);
    }
    context[flattenedParamName.get(originalPath)!] = defaultValue;
  }

  return { odes, variableMappings, parameterMappings, context };
}
