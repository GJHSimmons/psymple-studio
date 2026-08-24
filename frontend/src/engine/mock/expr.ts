/**
 * A small recursive-descent parser/AST for the subset of math expression
 * syntax psymple-style assignments use: + - * / ** (), identifiers, numbers.
 * Backs substitution (for compile-time wiring), numeric evaluation (for
 * simulation), and LaTeX rendering. See decision #15 for scope rationale.
 */

export type ExprNode =
  | { kind: "num"; value: number }
  | { kind: "sym"; name: string }
  | { kind: "neg"; arg: ExprNode }
  | { kind: "bin"; op: "+" | "-" | "*" | "/" | "**"; left: ExprNode; right: ExprNode };

type Token =
  | { type: "num"; value: number }
  | { type: "ident"; name: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" | "**" | "(" | ")" };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j])) j++;
      tokens.push({ type: "num", value: Number(source.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      tokens.push({ type: "ident", name: source.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "*" && source[i + 1] === "*") {
      tokens.push({ type: "op", value: "**" });
      i += 2;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "(" || c === ")") {
      tokens.push({ type: "op", value: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected character '${c}' in expression: ${source}`);
  }
  return tokens;
}

export function parseExpr(source: string): ExprNode {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];

  function parseAdditive(): ExprNode {
    let left = parseMultiplicative();
    let tok = peek();
    while (tok && tok.type === "op" && (tok.value === "+" || tok.value === "-")) {
      pos++;
      const right = parseMultiplicative();
      left = { kind: "bin", op: tok.value, left, right };
      tok = peek();
    }
    return left;
  }

  function parseMultiplicative(): ExprNode {
    let left = parseUnary();
    let tok = peek();
    while (tok && tok.type === "op" && (tok.value === "*" || tok.value === "/")) {
      pos++;
      const right = parseUnary();
      left = { kind: "bin", op: tok.value, left, right };
      tok = peek();
    }
    return left;
  }

  function parseUnary(): ExprNode {
    const tok = peek();
    if (tok && tok.type === "op" && tok.value === "-") {
      pos++;
      return { kind: "neg", arg: parseUnary() };
    }
    return parsePower();
  }

  function parsePower(): ExprNode {
    const base = parseAtom();
    const tok = peek();
    if (tok && tok.type === "op" && tok.value === "**") {
      pos++;
      const exponent = parseUnary();
      return { kind: "bin", op: "**", left: base, right: exponent };
    }
    return base;
  }

  function parseAtom(): ExprNode {
    const tok = peek();
    if (!tok) throw new Error(`Unexpected end of expression: ${source}`);
    if (tok.type === "num") {
      pos++;
      return { kind: "num", value: tok.value };
    }
    if (tok.type === "ident") {
      pos++;
      return { kind: "sym", name: tok.name };
    }
    if (tok.type === "op" && tok.value === "(") {
      pos++;
      const inner = parseAdditive();
      const close = peek();
      if (!close || close.type !== "op" || close.value !== ")") {
        throw new Error(`Expected ')' in expression: ${source}`);
      }
      pos++;
      return inner;
    }
    throw new Error(`Unexpected token in expression: ${source}`);
  }

  const result = parseAdditive();
  if (pos !== tokens.length) {
    throw new Error(`Unexpected trailing input in expression: ${source}`);
  }
  return result;
}

/** Replace every symbol named `from` with the AST `to`. */
export function substitute(node: ExprNode, from: string, to: ExprNode): ExprNode {
  switch (node.kind) {
    case "num":
      return node;
    case "sym":
      return node.name === from ? to : node;
    case "neg":
      return { kind: "neg", arg: substitute(node.arg, from, to) };
    case "bin":
      return {
        kind: "bin",
        op: node.op,
        left: substitute(node.left, from, to),
        right: substitute(node.right, from, to),
      };
  }
}

/** Rename symbols in bulk according to a from-name -> to-name map. */
export function renameSymbols(node: ExprNode, renames: ReadonlyMap<string, string>): ExprNode {
  switch (node.kind) {
    case "num":
      return node;
    case "sym": {
      const renamed = renames.get(node.name);
      return renamed ? { kind: "sym", name: renamed } : node;
    }
    case "neg":
      return { kind: "neg", arg: renameSymbols(node.arg, renames) };
    case "bin":
      return {
        kind: "bin",
        op: node.op,
        left: renameSymbols(node.left, renames),
        right: renameSymbols(node.right, renames),
      };
  }
}

export function evaluate(node: ExprNode, bindings: Record<string, number>): number {
  switch (node.kind) {
    case "num":
      return node.value;
    case "sym": {
      const value = bindings[node.name];
      if (value === undefined) throw new Error(`Unbound symbol '${node.name}' during evaluation`);
      return value;
    }
    case "neg":
      return -evaluate(node.arg, bindings);
    case "bin": {
      const left = evaluate(node.left, bindings);
      const right = evaluate(node.right, bindings);
      switch (node.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "**":
          return Math.pow(left, right);
      }
    }
  }
}

const PRECEDENCE: Record<"+" | "-" | "*" | "/" | "**", number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "**": 4,
};

function formatNumber(n: number): string {
  return String(n);
}

export function toExprString(node: ExprNode): string {
  return stringify(node, 0);
}

function stringify(node: ExprNode, parentPrec: number): string {
  switch (node.kind) {
    case "num":
      return formatNumber(node.value);
    case "sym":
      return node.name;
    case "neg": {
      const inner = stringify(node.arg, 3);
      const s = `-${inner}`;
      return parentPrec > 3 ? `(${s})` : s;
    }
    case "bin": {
      const prec = PRECEDENCE[node.op];
      const rightAssoc = node.op === "**";
      const left = stringify(node.left, rightAssoc ? prec + 1 : prec);
      const right = stringify(node.right, rightAssoc ? prec : prec + 1);
      const s = `${left}${node.op}${right}`;
      return prec < parentPrec ? `(${s})` : s;
    }
  }
}

/** Render as LaTeX for KaTeX display on the Compilation screen. */
export function toLatex(node: ExprNode): string {
  return latex(node, 0);
}

function latex(node: ExprNode, parentPrec: number): string {
  switch (node.kind) {
    case "num":
      return formatNumber(node.value);
    case "sym":
      return node.name;
    case "neg": {
      const inner = latex(node.arg, 3);
      const s = `-${inner}`;
      return parentPrec > 3 ? `\\left(${s}\\right)` : s;
    }
    case "bin": {
      if (node.op === "/") {
        return `\\frac{${latex(node.left, 0)}}{${latex(node.right, 0)}}`;
      }
      if (node.op === "**") {
        const base = latex(node.left, 5);
        const exponent = latex(node.right, 0);
        return `${base}^{${exponent}}`;
      }
      const prec = PRECEDENCE[node.op];
      const opStr = node.op === "*" ? " " : ` ${node.op} `;
      const left = latex(node.left, prec);
      const right = latex(node.right, prec + 1);
      const s = `${left}${opStr}${right}`;
      return prec < parentPrec ? `\\left(${s}\\right)` : s;
    }
  }
}
