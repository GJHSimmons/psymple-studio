# Psymple Studio — Roadmap

The wave/stream model and its mechanics are defined in `CLAUDE.md` (Part 2). This document
is the thing that decision names: it states **what must be true for each wave to close.** A
wave closes only when every one of its milestones is delivered; the next wave stays backlog
until it does.

Streams: **Foundation** (`shell`), **Engine** (`engine`), **Builder** (`builder`),
**Screens** (`screens`). See the repository map in `CLAUDE.md`.

> **Reversal (ARCH #17, supersedes #1):** the original plan phased a *mock* TypeScript engine
> (W1–W2) ahead of real psymple (W3). That mock turned out to mean re-implementing psymple's
> compiler, so it was dropped. Real psymple — via a thin FastAPI backend + `psymple_ext` —
> now lands in **Wave 1**, and Wave 3 becomes hardening + upstream transfer.

---

## Wave 1 — Foundation + Engine

Stand up the app and the engine seam so every later screen has something real to render.

**Milestones**

- `W1-Foundation` — Vite + React + TypeScript scaffold; design tokens (colours, radii,
  shadows, typography from the design handoff); the layout shell (collapsible nav rail,
  216px/60px, four screens, accent active-tick); routing / screen registry; shared UI
  primitives (Button, Tag, Segmented, Modal).
- `W1-Engine` — the `EngineInterface` contract as an **HTTP client to a FastAPI backend
  running real psymple**; the ported-object data model (name, type, ports {in/out/var},
  assignments, children, directed + variable wires); the seed Lotka–Volterra model;
  `psymple_ext` (ingestion: spec dict → psymple `System`; inspection: compiled `System` →
  structured JSON); the backend `/compile` + `/simulate` endpoints in a pinned `.venv`. No
  mock (ARCH #17).

**Closes when:** the app boots to the shell, all four nav destinations render (placeholder is
fine for Builder/screens), and the frontend compiles **and** simulates the seed model
end-to-end **through the real psymple backend**, demonstrated by a test or a rendered screen.

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

## Wave 3 — Hardening, upstream transfer, deploy

Real psymple moved into Wave 1 (ARCH #17), so this wave is no longer about *reaching* psymple —
it is what remains once the app works end-to-end.

**Milestones**

- `W3-Engine` — harden the backend (error handling, input validation, larger models); finalise
  `psymple_ext/` for **upstream transfer** to a future psymple release (a near-verbatim
  `git mv`, in psymple's own style — see *Code style boundaries* in `CLAUDE.md` and DESIGN #2);
  decide and record the precise per-capability upstream/glue split; and a deployment story (the
  Pyodide serverless option noted in #17 remains a fallback if a static deploy is required).

**Closes when:** `psymple_ext/` is self-contained enough to lift upstream, and the app has a
documented run/deploy path.
