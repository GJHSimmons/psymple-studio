# Psymple Studio — Roadmap

The wave/stream model and its mechanics are defined in `CLAUDE.md` (Part 2). This document
is the thing that decision names: it states **what must be true for each wave to close.** A
wave closes only when every one of its milestones is delivered; the next wave stays backlog
until it does.

Streams: **Foundation** (`shell`), **Engine** (`engine`), **Builder** (`builder`),
**Screens** (`screens`). See the repository map in `CLAUDE.md`.

---

## Wave 1 — Foundation + Engine

Stand up the app and the engine seam so every later screen has something real to render.

**Milestones**

- `W1-Foundation` — Vite + React + TypeScript scaffold; design tokens (colours, radii,
  shadows, typography from the design handoff); the layout shell (collapsible nav rail,
  216px/60px, four screens, accent active-tick); routing / screen registry; shared UI
  primitives (Button, Tag, Segmented, Modal).
- `W1-Engine` — the `EngineInterface` contract (`compile`, `simulate`, model types); the
  ported-object data model (name, type, ports {in/out/var}, assignments, children, wires);
  the seed Lotka–Volterra model; a **mock TypeScript engine** implementing the interface
  (live compile + fixed-step simulate).

**Closes when:** the app boots to the shell, all four nav destinations render (placeholder
is fine for Builder/screens), and the mock engine compiles **and** simulates the seed model
end-to-end, demonstrated by a test or a rendered screen.

---

## Wave 2 — Builder + Screens

Build the full UI at design fidelity, driven entirely by the mock engine. These two streams
run in parallel; they share the tokens and engine interface but otherwise touch disjoint
files.

**Milestones**

- `W2-Builder` — the nested canvas: recursive composite/leaf layout, pan + zoom + Fit,
  node/port/wire rendering (KaTeX equations, directed + variable wires with midpoint
  handles), wire creation by drag, hover-tracked add-port control, expand/collapse +
  nesting-depth control, the right inspector, and the Library + Object Editor modals.
- `W2-Screens` — Dashboard (model card grid), Compilation (System ODEs / Mappings / Context
  tabs, LIVE badge), Simulation (parameter panel + sliders, three result tabs: time series,
  phase plane, data table as SVG charts).

**Closes when:** all four screens match the design handoff and are driven by the mock engine
end-to-end — edits in the Builder flow through to Compilation and Simulation.

---

## Wave 3 — Real psymple engine + polish

Replace the mock engine with real psymple behind the identical `EngineInterface`, and build
the psymple-adjacent capabilities that make that possible.

**Milestones**

- `W3-Engine` — first a `[DESIGN]`/`[ARCH]` decision on the split between what goes upstream
  into psymple and what stays Studio glue; then `psymple_ext/` (ingestion from a spec dict;
  structured inspection of a compiled `System`) written in psymple's research-engineering
  style for later transfer; then a thin `backend/app/` FastAPI adapter exposing the
  `EngineInterface`; then swap the frontend onto it and verify parity against the mock.

**Closes when:** the app runs against real psymple 1.0.4 — the Compilation and Simulation
screens show genuine psymple output — and `psymple_ext/` is self-contained enough to lift
upstream with `git mv`.

**Note on `psymple_ext/`:** it is built here but destined for a future psymple release. It
is written to psymple's own style (pragmatic, not over-complete, lightly tested) — see the
*Code style boundaries* section of `CLAUDE.md` and the DESIGN decision recorded at adoption.
