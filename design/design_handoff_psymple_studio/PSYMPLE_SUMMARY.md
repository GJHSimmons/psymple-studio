# Psymple Modelling Studio — Functional Summary

Psymple is a compositional mathematical modelling tool. Users build ODE (ordinary differential equation) systems by composing smaller "ported objects" — leaf nodes with assignments and composite nodes that aggregate children via wiring. The interface has four main screens accessed via a collapsible left sidebar.

---

## Global UI

- **Left sidebar** — Navigation rail with four tabs: Models (dashboard), Builder, Compilation, Simulation. Shows a brand mark, version label ("research prototype · v0.4"), and a collapse/expand toggle that shrinks it to icon-only.
- **Design system** — Industry design system with a custom re-theme: white/grey palette, single blue accent (#649BA3). Blueprint-style cards with corner registration marks throughout.
- **Math rendering** — All formulae are rendered via KaTeX (LaTeX). ODEs display as `dx/dt = ...` fractions; algebraic assignments render with proper superscripts, subscripts, and fraction bars.

---

## 1. Dashboard (Models)

A grid of model cards. Each card shows:
- Model name and description
- Variable count, object count
- Status tag (compiled / draft / needs params)
- Last-edited timestamp

**Actions:** "Import" button (stub), "New model" button (navigates to Builder). Clicking any card also opens the Builder.

---

## 2. Builder (nested canvas)

The core workspace — an infinite pannable/zoomable canvas displaying the model as a nested node graph.

### Nodes
Every node is a "ported object" with three port types:
- **Input ports** (left edge) — parameters wired in from a parent composite, with optional default values
- **Output ports** (right edge) — values exposed outward
- **Variable ports** (bottom edge) — state variables that participate in aggregation

Nodes come in three types:
- **Variable (ode)** — A leaf with one or more differential assignments (`dx/dt = r·x`)
- **Functional (fn)** — A leaf with algebraic (non-ODE) assignments (`μ = C·ρ·A/(2m)`)
- **Composite (cmp)** — Contains children and internal wiring; can be expanded or collapsed

### Node interactions
- **Drag** — Reposition any node on the canvas
- **Click** — Select a node (highlights it, opens inspector)
- **Expand/collapse** (composites only) — Chevron button in the header toggles between showing children and showing compiled equations
- **Nesting depth** — Segmented control in the toolbar (1/2/3) sets how many levels auto-expand

### Wiring
Two wire types connect ports within a composite:
- **Directed wires** (solid line with arrowhead) — Source-to-target parameter substitution
- **Variable wires** (dotted line) — Aggregation of state variable contributions

**Creating wires:** Drag from any port circle to another port circle. A rubber-band preview follows the cursor. Wires route as cubic Bézier curves.

**Selecting/deleting wires:** Click the midpoint handle on a wire to select it (shows an ×); click again to delete. Also deletable from the inspector's wire list.

### Adding ports to composites
Hovering near the edge of a composite node shows a dashed "+" button that tracks the cursor position along that edge (left = input, right = output, bottom = variable). Clicking it opens a modal dialog to name the new port (and set a default value for inputs). Port circles sit at z-index above the adder so existing ports remain draggable.

### Canvas controls
- **Zoom** — +/− buttons with percentage readout, or the toolbar
- **Fit** — "Fit" button auto-frames all nodes
- **Pan** — Click and drag on empty canvas space
- **Legend** — Bottom-left card explains wire types and port color coding

### Right inspector panel
When a node is selected, the right panel (296px) shows:
- Node type and name, with an "Edit →" button
- **Leaves:** Assignment list (rendered in KaTeX), input ports with defaults, variable/output port chips
- **Composites:** Internal wire list (editable — delete individual wires), port groups
- **"Compiles to" section** — Live preview of the node's compiled equations with a green "LIVE" badge

When nothing is selected, a placeholder prompts the user to select a node.

### Toolbar
- Model name + type tag
- Nesting depth selector
- Zoom controls
- Fit, Add object (opens library), Compile button

### Overlays (modal dialogs over the builder)

#### Component Library
Grid of all available ported objects grouped by type (Variable, Functional, Composite). Each card shows:
- Name, type tag, description
- KaTeX-rendered equations
- Tags (e.g. "1 var", "2 params")
- Search field at top
- Click a card → opens the Object Editor

#### Object Editor
Full editing dialog for a single ported object. Layout: left main area + right ports panel.

**For leaves (variable/functional):**
- Name and type fields
- List of differential/parameter assignments, each with:
  - KaTeX-rendered LHS
  - Editable RHS input field
  - Live preview row showing the full rendered equation
  - Delete button
- "Add assignment" button
- Right panel: port groups (input with default values, variable, output)

**For composites:**
- Name and type fields
- Info banner explaining composites have no assignments — equations emerge from wiring
- Wire editor: lists all directed and variable wires with delete buttons, "Add wire" button
- Right panel: port groups with "Add" buttons per group; explanatory text about adding ports here or on canvas

---

## 3. Compilation

Shows the result of compiling the composite model tree into a flat ODE system. Three sub-tabs:

### System ODEs
The final compiled differential equations (e.g. `dx/dt = a·x·(1 − x/K) − b·x·y`), KaTeX-rendered at large size. Explanatory text notes these update live on edit.

### Mappings
Two-column layout:
- **Variable mappings** — Maps model variables to system vector indices (x → x₀, y → x₁, T → t)
- **Parameter mappings** — Maps component port paths to flat parameter indices with values (e.g. `prey.r → a` = `a₀ = 0.4`)

### Context
- **Utility functions** — User-defined helper functions available inside assignments (table with name, signature, definition). "Add utility function" button.
- **System parameters** — System-wide symbol definitions that override child port defaults (table with name, signature, definition). "Add system parameter" button.

**Header:** "LIVE — recompiles on edit" badge, "Simulate" button to proceed.

---

## 4. Simulation

Runs a numerical integration (forward Euler) of the compiled system. Layout: left parameter panel + right results area.

### Parameter panel (left, 300px)
- **Initial values** — Numeric inputs for x(0) and y(0)
- **Parameter sliders** — Each model parameter (a, K, b, c, d) with:
  - Label showing symbol, description, and current value
  - Range slider with accent-colored fill
- **t_end** — Numeric input for simulation duration
- **Dirty indicator** — When parameters change, a banner says "Parameters changed — re-run to update"
- **Solver toggle** — Segmented control for "continuous" vs "discrete" (in header)

### Results area (right)
Three sub-tabs:

#### Time Series
SVG line chart plotting x (prey) and y (predator) over time t. Color-coded legend below. Axis labels and grid lines.

#### Phase Plane
SVG plot of y vs x trajectory. Shows initial state (hollow circle) and final state (filled circle). Descriptive text about spiral convergence.

#### Data Table
Tabular output (every 5th sample) with columns: t, x (prey), y (predator). Monospace formatted with color-coded values.

---

## Data Model

The model tree is defined in `tree()` as a nested JavaScript object. The demo model is a Lotka–Volterra ecosystem with:
- **ecosystem** (composite, root) — 2 variable ports (x, y)
  - **prey** (composite) — logistic growth, 2 inputs (r, K), 1 variable (x)
    - **pop** (variable) — `dx/dt = r·x`
    - **limit** (variable) — `dx/dt = −r/K·x²`
  - **pred** (variable) — exponential decay, `dx/dt = r·x`
  - **pred_prey** (variable) — interaction term, `dx/dt = r₁·x·y`, `dy/dt = r₂·x·y`

Wires connect inputs to child ports (directed) and child variables to parent variables (aggregation).

### State management
All UI state lives in `this.state`:
- `screen` — current tab
- `pos` — dragged node positions
- `exp` — expand/collapse overrides per composite
- `sel` / `selWire` — current selection
- `zoom`, `pan` — canvas viewport
- `wires` — mutable wire overrides (edits on canvas or in inspector)
- `wireFrom`, `mouse` — in-progress wire drag
- `params`, `ran` — simulation parameters and dirty flag
- `addedPorts`, `newPort` — user-created ports on composites
- `depth` — default nesting expansion level
- `overlay` — which modal is open (library/editor/null)
- `tab`, `ctab` — active sub-tabs in simulation/compilation
- `railCollapsed` — sidebar state
