# psymple_ext

psymple-adjacent capabilities that psymple has no clean surface for yet — model **ingestion**
from a spec dict, and structured **inspection** of a compiled system. Built here now, in
psymple's own research-engineering style, **destined for a future psymple release** (DESIGN
decision #2). The package layout mirrors psymple's own (`build/`, `simulate/`) so the eventual
transfer is a near-verbatim `git mv`, not a refactor.

Written to be importable independently of the Studio FastAPI glue — it depends only on psymple,
never on `backend/`.

## Layout (mirrors psymple)

The package uses a `src/` layout so `import psymple_ext` always resolves to the
installed package, never to this project directory (which shares its name).

```
psymple_ext/
  pyproject.toml
  src/psymple_ext/
    build/
      ingestion.py    # spec dict -> FunctionalPortedObject / VariablePortedObject
                      #   / CompositePortedObject + System   (recursive builder)
      inspection.py   # compiled System -> structured dict:
                      #   ODEs, variable mappings, parameter mappings, context
    simulate/
      runner.py       # System + options -> { times, series }
  tests/
```

Install editable into the backend venv: `pip install -e ../psymple_ext`.

## Style boundary

This is **not** Studio app code. It follows psymple's idiom: pragmatic, not over-complete,
lightly tested, matching psymple's module layout, naming, and docstring conventions. Do not
gold-plate it or add test scaffolding psymple itself would not carry (see CLAUDE.md →
*Code style boundaries*).

Where real psymple would naturally need a change, that goes in a **separate additive file**
here (not a monkeypatch of installed psymple), so it can be lifted upstream cleanly.
