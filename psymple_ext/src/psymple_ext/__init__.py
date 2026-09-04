"""
psymple-adjacent capabilities not yet in psymple itself: building a model from a
plain spec dictionary (``build``) and inspecting a compiled system as structured
data (``build.inspection``), plus a thin simulation runner (``simulate``).

The layout mirrors psymple's own package (``build/``, ``simulate/``) so these
modules can be transferred upstream with a near-verbatim ``git mv``.
"""

from .build.ingestion import build_ported_object, build_system
from .build.inspection import inspect_system
from .simulate.runner import run_simulation

__all__ = [
    "build_ported_object",
    "build_system",
    "inspect_system",
    "run_simulation",
]
