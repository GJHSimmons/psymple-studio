import type { PortedObjectNode } from "./types";

/**
 * Demo/seed data: a logistic-prey Lotka-Volterra ecosystem, matching
 * psymple's own predator-prey and logistic-prey documentation examples.
 *
 *   ecosystem
 *     +- prey (cmp: r=0.4, K=10)
 *     |    +- pop    x' = r*x
 *     |    +- limit  x' = -r/K * x**2
 *     +- pred          x' = r*x            (r = -0.2)
 *     +- pred-prey     x' = r_1*x*y, y' = r_2*x*y   (r_1 = -0.2, r_2 = 0.1)
 */

const pop: PortedObjectNode = {
  name: "pop",
  type: "ode",
  ports: {
    input: [{ name: "r" }],
    output: [],
    variable: ["x"],
  },
  assignments: [{ target: "x", expression: "r*x" }],
};

const limit: PortedObjectNode = {
  name: "limit",
  type: "ode",
  ports: {
    input: [{ name: "r" }, { name: "K" }],
    output: [],
    variable: ["x"],
  },
  assignments: [{ target: "x", expression: "-r/K*x**2" }],
};

const prey: PortedObjectNode = {
  name: "prey",
  type: "cmp",
  ports: {
    input: [
      { name: "r", default: 0.4 },
      { name: "K", default: 10 },
    ],
    output: [],
    variable: ["x"],
  },
  assignments: [],
  children: [pop, limit],
  directedWires: [
    { source: "r", destination: ["pop.r", "limit.r"] },
    { source: "K", destination: "limit.K" },
  ],
  variableWires: [{ childPorts: ["pop.x", "limit.x"], parentPort: "x" }],
};

const pred: PortedObjectNode = {
  name: "pred",
  type: "ode",
  ports: {
    input: [{ name: "r", default: -0.2 }],
    output: [],
    variable: ["x"],
  },
  assignments: [{ target: "x", expression: "r*x" }],
};

const predPrey: PortedObjectNode = {
  name: "pred-prey",
  type: "ode",
  ports: {
    input: [
      { name: "r_1", default: -0.2 },
      { name: "r_2", default: 0.1 },
    ],
    output: [],
    variable: ["x", "y"],
  },
  assignments: [
    { target: "x", expression: "r_1*x*y" },
    { target: "y", expression: "r_2*x*y" },
  ],
};

export const seedEcosystem: PortedObjectNode = {
  name: "ecosystem",
  type: "cmp",
  ports: {
    input: [],
    output: [],
    variable: ["x", "y"],
  },
  assignments: [],
  children: [prey, pred, predPrey],
  variableWires: [
    { childPorts: ["prey.x", "pred-prey.x"], parentPort: "x" },
    { childPorts: ["pred.x", "pred-prey.y"], parentPort: "y" },
  ],
};
