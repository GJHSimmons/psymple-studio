"""
FastAPI service exposing psymple's compile and simulate over the wire contract the
frontend's `EngineInterface` client calls. Studio glue: thin, stateless, and it
does no modelling maths itself — that is psymple's job, via `psymple_ext`.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from psymple.abstract import DependencyError, ParsingError
from psymple.build.errors import SystemError, ValidationError, WiringError

from .dtos import CompiledSystem, CompileRequest, SimulateRequest, SimulationResult
from .engine import compile_spec, simulate_spec

# Errors that mean "the submitted model is invalid" rather than "the server broke".
MODEL_ERRORS = (
    WiringError,
    ValidationError,
    SystemError,
    DependencyError,
    ParsingError,
    ValueError,
    KeyError,
)

# Vite dev server origins the browser will call this service from.
DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(title="Psymple Studio backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/compile", response_model=CompiledSystem)
def compile_endpoint(request: CompileRequest) -> CompiledSystem:
    try:
        compiled = compile_spec(request.tree.to_spec())
    except MODEL_ERRORS as error:
        raise HTTPException(status_code=422, detail=str(error))
    return CompiledSystem(**compiled)


@app.post("/simulate", response_model=SimulationResult)
def simulate_endpoint(request: SimulateRequest) -> SimulationResult:
    try:
        result = simulate_spec(
            request.tree.to_spec(),
            initial_values=request.initial_values,
            t_end=request.t_end,
            parameters=request.parameters,
            solver=request.solver,
            dt=request.dt,
        )
    except MODEL_ERRORS as error:
        raise HTTPException(status_code=422, detail=str(error))
    return SimulationResult(**result)
