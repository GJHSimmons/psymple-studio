You are implementing **Psymple**, a compositional mathematical modelling tool, in this codebase.

Read `README.md` and `PSYMPLE_SUMMARY.md` in this handoff folder first — they are the full spec (screens, layout, interactions, state shape, and exact design tokens: colors, radii, shadows, typography). `Psymple.dc.html` is a high-fidelity HTML/React design prototype — open it in a browser to see and click through the real behavior. **Do not copy its markup or inline styles verbatim** — recreate the design pixel-accurately using this codebase's existing component library, styling approach (CSS modules/Tailwind/styled-components/whatever is already established here), state-management conventions, and file structure. If this project has no established frontend stack yet, pick a sensible one (React + a lightweight state store is a safe default given the prototype's structure) and set it up.

Build in this order:
1. **Layout shell** — left nav rail (collapsible, 216px/60px) with the four screens (Models, Builder, Compilation, Simulation) and the small accent margin-tick active-indicator; main content area.
2. **Dashboard** — static model card grid, "New model" → Builder.
3. **Builder canvas** — this is the core of the app:
   - Recursive box layout for the nested composite/leaf tree (a composite lays out its children inside itself; siblings must not overlap — grow to clear already-placed neighbors).
   - Pan (drag empty canvas) and zoom (buttons + "Fit").
   - Node rendering: header (name, type tag, expand/collapse chevron for composites) + body (KaTeX-rendered equations for leaves/collapsed composites) + ports (input/output/variable circles with diagonally-offset mono labels).
   - Wire rendering as SVG bezier paths (directed = solid+arrowhead, variable = dashed) with a clickable midpoint handle (select → click again to delete).
   - Wire creation by dragging from one port to another (live rubber-band preview).
   - Hover-tracked "add port" control that follows the cursor along a composite's nearest edge, opening a small "name the new port" modal on click.
   - Right-side inspector panel reflecting the current selection (assignments/ports/wires, plus a live "compiles to" preview).
   - Library and Object Editor modals (see README for exact contents).
4. **Compilation screen** — System ODEs / Mappings / Context tabs, all KaTeX-rendered, "LIVE" badge.
5. **Simulation screen** — parameter sliders + numeric inputs driving a simple fixed-step integrator, three result tabs (time series / phase plane / data table) rendered as SVG charts.

Use real math rendering (KaTeX or an equivalent already used in this codebase) for every equation — don't hand-roll HTML sup/sub fraction hacks.

Treat the demo data (Lotka–Volterra ecosystem: prey/pred/pred_prey objects and their equations) as sample/seed data only — keep the underlying data shapes (ported object: name, type, ports {in, out, var}, assignments, children, wires) generic enough to hold a real compiler's output later.

Match the design tokens in README.md exactly (accent `#649BA3`, the neutral/accent color ramps, 12px card radius, the specified shadow values, Helvetica Neue UI type + IBM Plex Mono for equations/machine text) unless this codebase already has an established design system it should take precedence for tokens not specific to Psymple's own accent.
