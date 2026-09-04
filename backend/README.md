# Studio backend

A thin FastAPI service that runs real [`psymple`](https://github.com/casasglobal-org/psymple)
(via [`psymple_ext/`](../psymple_ext/)) behind the compile/simulate wire contract the
frontend's `EngineInterface` client calls. Implements ARCH decision #17.

Studio glue — conventional, stable, tested. It does **no** modelling maths itself: ingestion,
compilation, and simulation are psymple's job, reached through `psymple_ext`.

## Endpoints

- `POST /compile` — `{ tree }` → compiled system JSON (ODEs, variable/parameter mappings, context).
- `POST /simulate` — `{ tree, initialValues, parameters?, tEnd, solver, dt? }` → `{ times, series }`.

The service is stateless: `/simulate` re-ingests and compiles the tree, then simulates
(decision: PR #20, Fork 1). Wire DTOs are `camelCase`; `psymple_ext` stays `snake_case`
and the FastAPI layer aliases at the boundary (Fork 2).

## Setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -U pip
.venv/Scripts/pip install -r requirements.txt   # pinned; installs psymple + FastAPI stack
.venv/Scripts/pip install -e ../psymple_ext      # psymple-adjacent code, editable
```

## Run

```bash
backend/.venv/Scripts/uvicorn app.main:app --reload --port 8000
```

(run from `backend/`). A `.claude/launch.json` entry is provided for the dev preview.

`.venv/` is gitignored; `requirements.txt` pins exact versions for reproducibility.
