import { describe, expect, it } from "vitest";
import { evaluate, parseExpr, renameSymbols, substitute, toExprString, toLatex } from "../expr";

describe("parseExpr + evaluate", () => {
  it("evaluates arithmetic with correct precedence", () => {
    expect(evaluate(parseExpr("1+2*3"), {})).toBe(7);
    expect(evaluate(parseExpr("(1+2)*3"), {})).toBe(9);
    expect(evaluate(parseExpr("2**3"), {})).toBe(8);
    expect(evaluate(parseExpr("-2**2"), {})).toBe(-4);
  });

  it("evaluates identifiers against bindings", () => {
    expect(evaluate(parseExpr("r*x"), { r: 0.4, x: 10 })).toBe(4);
    expect(evaluate(parseExpr("-r/K*x**2"), { r: 0.4, K: 10, x: 5 })).toBeCloseTo(-1);
  });

  it("throws on an unbound symbol", () => {
    expect(() => evaluate(parseExpr("r*x"), { r: 1 })).toThrow(/Unbound symbol 'x'/);
  });
});

describe("substitute / renameSymbols", () => {
  it("substitute replaces a symbol with an arbitrary subtree", () => {
    const ast = parseExpr("r*x");
    const replaced = substitute(ast, "r", parseExpr("a+b"));
    expect(evaluate(replaced, { a: 1, b: 2, x: 5 })).toBe(15);
  });

  it("renameSymbols renames multiple symbols in one pass", () => {
    const ast = parseExpr("r_1*x*y");
    const renamed = renameSymbols(
      ast,
      new Map([
        ["x", "ecosystem.x"],
        ["y", "ecosystem.y"],
      ]),
    );
    expect(evaluate(renamed, { r_1: -0.2, "ecosystem.x": 10, "ecosystem.y": 2 })).toBeCloseTo(-4);
  });
});

describe("toExprString / toLatex", () => {
  it("round-trips through parse -> stringify -> parse -> evaluate", () => {
    const ast = parseExpr("-r/K*x**2");
    const restring = toExprString(ast);
    expect(evaluate(parseExpr(restring), { r: 0.4, K: 10, x: 5 })).toBeCloseTo(-1);
  });

  it("renders a fraction and a power in LaTeX", () => {
    expect(toLatex(parseExpr("r/K"))).toBe("\\frac{r}{K}");
    expect(toLatex(parseExpr("x**2"))).toBe("x^{2}");
  });
});
