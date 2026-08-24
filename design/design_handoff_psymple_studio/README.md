# Handoff: Psymple Modelling Studio

## Overview
Psymple is a compositional mathematical modelling tool. Users assemble ODE (ordinary differential equation) systems out of small reusable "ported objects" (leaf nodes with equations, and composite nodes that nest and wire children together), then compile the tree into a flat simulable system and run/inspect a numerical integration.

## About the Design Files
The bundled file (`Psymple.dc.html`) is a **design reference prototype built in HTML/React** (a single self-contained "Design Component" file, not a production app). It exists to show intended look, layout, and interaction behavior precisely — not to be shipped or embedded as-is. The task is to **recreate this design in the target codebase's real environment** (React/Vue/Svelte/native — whatever the project already uses, or the best-suited framework if starting fresh) using that codebase's own component patterns, state management, and build tooling. Treat the HTML as the interaction/visual spec, not as code to copy-paste.

## Fidelity
**High-fidelity.** Colors, spacing, radii, shadows, and typography below are final values, not placeholders. Recreate pixel-accurately. The math (equation strings, port names, default values) is demo/sample data — keep the *shape* of the data model but real inputs will come from an actual compiler backend.

---

## Screens / Views

### 1. Dashboard ("Models")
- **Purpose:** Landing page listing existing models; entry point to create/open one.
- **Layout:** Full-height column. Header (title + "workspace" eyebrow + action buttons) then a scrollable content area with `padding: 26px`. Cards laid out in `grid-template-columns: repeat(auto-fill, minmax(300px,1fr))`, `gap: 20px`, `max-width: 960px`.
- **Card component:** white surface, 1px divider border, 12px radius, `--shadow-sm`, padding `18px 18px 15px`, cursor pointer (opens Builder). Header row: model name (19px) + status tag right-aligned (`flex; justify-content:space-between`). Description below (13px, muted, `margin:6px 0 14px`). Footer stat row: variable count + object count (mono, bold numbers) + "edited Xh ago" pushed right (`margin-left:auto`), separated from the body by a 1px divider top-border with `padding-top:11px`.
- **Header actions:** "Import" (secondary button, box icon) and "New model" (primary button, plus icon) — top-right.

### 2. Builder (nested canvas — the core screen)
- **Purpose:** Visually construct/edit the composite model tree: drag nodes, wire ports, expand/collapse composites, add new ports.
- **Layout:** Column: toolbar (flex row, wraps, `padding:11px 20px`, border-bottom) → flex row of `{canvas | inspector}`.
- **Toolbar contents (left→right):** model name (18px semibold) + "composite" outline tag · nesting-depth segmented control (1/2/3, label "nesting") · spacer · zoom control (blueprint pill: `−` button / `NN%` mono readout / `+` button) · Fit button · Add object button · Compile button (primary, arrow icon).
- **Canvas:** flex:1, `overflow:hidden`, `cursor:grab`, white background with a repeating radial-gradient dot grid (`22px 22px` tile, dot color `#d3d9db`, size `1.15px`). Click-drag on empty canvas pans (translate); scroll/buttons zoom (`0.4–1.6`, clamped, world transformed via `translate(pan) scale(zoom)`, origin `0 0`).
- **Nodes ("ported objects"):** absolutely positioned boxes, white translucent (opacity ~78% expanded / ~88% collapsed via `color-mix`), 12px-radius bordered card, `--shadow-md`, selected state adds a 3px accent-tinted outline ring. Header row (`padding:6px 9px 5px`, tinted background `color-mix(accent 8%)`, bottom hairline `color-mix(accent 25%)`): chevron expand/collapse button (composites only, rotates -90° collapsed) + mono bold name, right-aligned 9px uppercase type tag (`ode`/`fn`/`cmp`).
  - **Leaf body** (padding `6px 9px 10px`): stacked list of KaTeX-rendered assignments, e.g. `dx/dt = r·x(1 − x/K)`.
  - **Collapsed composite body:** live-compiled equation(s) rendered the same way, plus an italic muted "live · N objects" caption with a small accent dot.
  - **Expanded composite:** no body — instead hosts child node boxes positioned inside it (recursive layout), with a dashed border instead of solid.
  - **Ports:** small circles (11px, white fill, 1.5px accent border; grey border for variable ports), positioned along the box edge — inputs on the left edge, outputs on the right edge (both spaced only across the *lower* portion of the box, below the 30px header band), variable ports along the bottom edge (spaced across full width). Hover fills the port solid accent with a soft glow ring; an in-progress wire drag "arms" the source port (solid fill + glow).
  - **Port labels:** small mono text, offset ~5px diagonally from each port (inputs read to the lower-left, outputs/variables to the lower-right), staying horizontal (not rotated).
- **Edge "add port" control:** while hovering a composite box, a dashed circular "+" button (16px, accent dashed border) appears at the point on the box's perimeter closest to the cursor — left edge → input, right edge → output, bottom edge → variable — clamped away from the corners with ~16px padding. It disappears on mouse-leave. Clicking opens the "add port" modal (name + optional default value for inputs).
- **Wires:** SVG cubic-Bézier paths layered per-composite (z-ordered by nesting depth). Two kinds: **directed** (solid, arrowhead, accent color, source→target substitution) and **variable** (dashed `1 5`, thicker, darker accent, aggregation into a parent variable). A circular handle sits at the wire's midpoint — small colored dot by default, grows to a bordered white circle with an × glyph when selected; click selects, click again deletes. Dragging from any port circle to another draws a live dashed rubber-band preview that snaps into a real wire on drop (role/direction inferred from which ports are inputs vs outputs/variables and which composite owns the connection).
- **Legend card:** bottom-left floating card explaining wire types and port-side color coding.
- **Hint text:** bottom-right floating italic muted caption with the two core interaction hints.
- **Inspector panel (right, 296px fixed):** border-left divider, white background. Empty state: centered eye icon + muted instructional copy. Selected-node state: eyebrow (type + "ported object") + name + "Edit →" link button; then sectioned lists (11px uppercase `h6` headers) for Assignments (leaves only, each in a bordered row, KaTeX), Input ports (name + default/"— (wired)"), Variable ports (chip row), Output ports (chip row), and for composites an editable **Internal wires** list (colored dot + `from → to` mono label + delete button) instead of assignments. A final **"Compiles to"** section shows the live-compiled equation(s) in a tinted box with a small pill-shaped "LIVE" badge (accent background, white dot + text).

#### Overlay: Component Library (modal)
Full-bleed dialog (`min(1080px,94vw) × min(90vh,900px)`), header with eyebrow/title/subtitle and close (×) button, "New object" primary action. Body: search input, then three groups (Variable / Functional / Composite) each with an uppercase label + horizontal divider rule, and a `repeat(auto-fill,minmax(258px,1fr))` card grid. Each card: mono bold name + type tag, muted description, divider, KaTeX equation line(s), and a row of small tag chips (e.g. "1 var", "2 params"). Clicking a card opens the Object Editor for it.

#### Overlay: Object Editor (modal)
Same dialog chrome. Two-column body (`1fr 340px`): main column + right "Ports" panel.
- **Leaf editor:** name/type fields row, then a card per assignment — mono LHS (KaTeX, right-aligned) `=` editable RHS input + delete button, plus a "preview" sub-row rendering the live KaTeX result. "Add assignment" button below.
- **Composite editor:** name/type fields, an info banner (icon + copy) explaining composites have no assignments of their own — equations emerge from wiring — then two grouped, editable wire lists (directed / variable), each row a small card with colored dot, `from → to` mono label, delete button, and an "Add wire" button.
- **Ports panel (both):** grouped by Input / Variable / Output, each entry a colored dot + mono name (+ an editable default-value input for inputs); composites get inline "Add"/"remove" affordances per group.

### 3. Compilation
- **Purpose:** Show the flattened system produced by the composite tree.
- **Layout:** Header (title, "ecosystem → simulable system" eyebrow, LIVE badge, "Simulate" primary button) → status/tab strip (green check "Compiled · no unresolved symbols" + 3 underline tabs: System ODEs / Mappings / Context) → scrollable content, `max-width:940px`.
- **System ODEs tab:** stacked large (20px) KaTeX-rendered equations in a bordered panel, plus an explanatory caption.
- **Mappings tab:** two side-by-side panels — Variable mappings (`x → x₀` table) and Parameter mappings (`prey.r → a` / `a₀ = 0.4` table).
- **Context tab:** a "Time" panel (independent variable note), then two panels — Utility functions and System parameters — each a table (name / signature / definition) with an "Add …" button and descriptive copy.

### 4. Simulation
- **Purpose:** Run a numerical integration of the compiled system and inspect results.
- **Layout:** Header (title, eyebrow, continuous/discrete segmented toggle, "Run simulation" primary button) → flex row `{params panel (300px) | results}`.
- **Params panel:** Initial values (two numeric inputs, x(0)/y(0)), Parameters (one labeled range slider per parameter — mono symbol + muted description + current value above an accent-gradient-filled `<input type=range>`), `t_end` numeric input, and — when a param changed since last run — a bordered accent warning strip ("Parameters changed — re-run to update").
- **Results:** 3 underline tabs (Time series / Phase plane / Data table) over a scrollable panel.
  - **Time series:** SVG line chart, x & y populations over t, axis ticks/gridlines, legend below (colored swatch + mono label).
  - **Phase plane:** SVG y-vs-x trajectory with gridlines, hollow circle (initial state) and filled circle (final state), muted caption describing convergence.
  - **Data table:** mono table (every 5th sample) of t / x / y, color-coded value columns.

---

## Interactions & Behavior
- **Node drag:** mousedown on a node (not its ports/buttons) starts a drag that repositions it (clamped ≥0), tracked via document-level mousemove/mouseup listeners; releases on mouseup.
- **Canvas pan:** mousedown on empty canvas background (not on a node) drags the world transform.
- **Zoom:** `+`/`−` buttons step by 0.1 within `[0.4, 1.6]`; "Fit" computes a zoom/pan that frames the whole tree with padding.
- **Wire create:** mousedown on a port starts a drag (rubber-band dashed preview follows the cursor in world space); mouseup on another port commits a real wire if the two ports have compatible/opposite roles within a common ancestor composite; releasing over empty space cancels.
- **Wire select/delete:** click the wire's midpoint handle to select (handle grows, shows ×); click again to delete. Also deletable from the inspector's or editor's wire list — the two stay in sync.
- **Port add:** hovering a composite's box tracks the cursor and shows a "+" at the nearest point on whichever edge (left/right/bottom) is closest, respecting corner padding; click opens a small modal to name the port (and, for inputs, set an optional default). New ports render in the graph and inspector immediately.
- **Expand/collapse:** chevron on a composite header toggles between showing its children (recursive layout, auto-growing to avoid sibling collisions) and showing its live-compiled equation(s). A global "nesting" depth control (1/2/3) sets the default expand depth; explicit per-node toggles override it.
- **Tabs:** all tab strips (Compile, Simulate) are simple state-driven underline tabs — 24px gap, 2px accent bottom-border on the active tab, active label bold + near-black, inactive medium-weight + slate.
- **Sliders/inputs:** simulation parameter changes mark results stale (dirty banner) until "Run simulation" is clicked, which re-integrates (simple fixed-step Euler) and redraws all three result views.
- **Sidebar collapse:** a toggle button shrinks the left rail to icon-only width (60px ⟷ 216px), animated.

## State Management
Key pieces of state a real implementation will need: current screen/tab; node position overrides (dragged nodes) keyed by id; per-node expand/collapse overrides; current selection (node id) and wire selection (`{owner, kind, index}`); canvas zoom + pan; a mutable per-composite wire list (so canvas edits and inspector/editor edits stay in sync); in-progress wire-drag endpoint + live cursor position; in-progress "new port" draft (side + name + default); simulation parameters + a "results are stale" flag; which modal overlay (if any) is open and which object it's editing; sidebar collapsed flag. See `PSYMPLE_SUMMARY.md` (bundled) for the full state shape used by the prototype.

## Design Tokens

**Color**
| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#ffffff` | page/card background |
| `--color-surface` | `#f7f8f9` | secondary surface |
| `--color-shell` | `#f1f3f4` | app chrome background |
| `--color-text` | `#151a1d` | primary text |
| `--color-divider` | `#e6e9ea` | hairline borders |
| `--color-neutral-100/200/300` | `#f4f6f6` / `#edf0f1` / `#dbe0e2` | subtle fills, hover states |
| `--color-neutral-600/800` | `#6a7478` / `#394245` | secondary/strong text |
| `--color-accent` | `#649BA3` | the one functional accent — active/selected/live/wired |
| `--color-accent-100…900` | `#eff5f6, #dcebed, #bcd7da, …, #56888f, #457077, #345a60, #25454a` | accent tint/shade ramp |
| `--color-accent-2-*` | `#f1f3f4, #e7eaec, #4a555b, #39434a` | secondary neutral-slate ramp (used for output ports / functional-type labels) |

**Typography** — UI text: `'Helvetica Neue', Helvetica, Arial, sans-serif`. Genuine machine text (equations, ids, mono labels, KaTeX) uses `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace`. Headings tighten letter-spacing (`-0.015em`); small uppercase eyebrows/labels track wide (`.08–.14em`).

**Radii:** cards/dialogs `12px`; buttons/inputs/segmented `8px`; segmented-option `6px`; tags `999px` (pill).

**Shadows:** `--shadow-sm: 0 1px 3px rgba(28,37,41,.06), 0 1px 2px rgba(28,37,41,.04)` · `--shadow-md: 0 4px 12px rgba(28,37,41,.08)` · `--shadow-lg: 0 10px 30px rgba(28,37,41,.10)` — all faint, cool-slate tinted; used only to lift a true surface (cards, modals), never decoratively.

**Spacing:** roughly a 4–8px rhythm (component paddings mostly `6–22px`); rail width `216px` (`60px` collapsed); inspector/params panels `296–300px`.

**Motion:** short, calm — `.12–.16s` on color/opacity/transform (chevron rotation, ghost-button fade-in, rail collapse width).

## Assets
- **Math rendering:** KaTeX (`katex@0.16.9` CSS + JS via jsdelivr CDN) — renders every equation from a small custom expression→LaTeX transform.
- **Font:** IBM Plex Mono loaded from Google Fonts; Helvetica Neue is a system stack (no webfont).
- **Icons:** hand-authored inline SVGs in a line style (24px viewBox, ~1.5–1.6 stroke, round caps/joins) — grid, share/network, sigma, chart, play, plus, arrow, fit, x, check, dot, eye, chevron. No icon library dependency; swap for the target codebase's icon set (e.g. Lucide) 1:1 by shape/meaning.
- **Background pattern:** the canvas dot-grid is a CSS `radial-gradient` tile, not an image.

## Files
- `Psymple.dc.html` — the full interactive prototype (source of truth for exact layout/behavior; open directly in a browser).
- `PSYMPLE_SUMMARY.md` — a functional walkthrough of every screen/tab/interaction, written for an agent with no prior context on the tool.
- `AGENT_PROMPT.md` — a ready-to-use kickoff prompt for a coding agent implementing this in a real codebase.
