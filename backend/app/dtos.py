"""
Wire-contract data transfer objects for the compile/simulate API.

The wire is camelCase (the frontend's `EngineInterface` types); the Python fields
are snake_case and carry camelCase aliases. Request models accept either spelling
(`populate_by_name`); response models serialise to camelCase (`by_alias`). This
keeps `psymple_ext` free of any wire concern — the boundary aliases live here.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

# --- Request: the ported-object tree spec (mirrors frontend PortedObjectNode) ---


class _CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class InputPortSpec(_CamelModel):
    name: str
    default: float | None = None


class PortSetSpec(_CamelModel):
    input: list[InputPortSpec] = []
    output: list[str] = []
    variable: list[str] = []


class AssignmentSpec(_CamelModel):
    target: str
    expression: str


class DirectedWireSpec(_CamelModel):
    source: str
    destination: str | list[str]


class VariableWireSpec(_CamelModel):
    child_ports: list[str] = Field(alias="childPorts")
    parent_port: str = Field(alias="parentPort")


class PortedObjectNode(_CamelModel):
    name: str
    type: str  # "ode" | "fn" | "cmp"
    ports: PortSetSpec = Field(default_factory=PortSetSpec)
    assignments: list[AssignmentSpec] = []
    children: list[PortedObjectNode] | None = None
    directed_wires: list[DirectedWireSpec] | None = Field(
        default=None, alias="directedWires"
    )
    variable_wires: list[VariableWireSpec] | None = Field(
        default=None, alias="variableWires"
    )

    def to_spec(self) -> dict:
        """Return the snake_case plain dict consumed by ``psymple_ext``."""
        return self.model_dump(by_alias=False, exclude_none=True)


class CompileRequest(_CamelModel):
    tree: PortedObjectNode


class SimulateRequest(_CamelModel):
    tree: PortedObjectNode
    initial_values: dict[str, float] = Field(alias="initialValues")
    parameters: dict[str, float] | None = None
    t_end: int = Field(alias="tEnd")
    solver: str = "continuous"  # "continuous" | "discrete"
    dt: float | None = None


# --- Response: compiled system + simulation result -------------------------------


class Ode(_CamelModel):
    variable: str
    expression: str


class CompiledSystem(_CamelModel):
    model_config = ConfigDict(populate_by_name=True)

    odes: list[Ode]
    variable_mappings: dict[str, str] = Field(serialization_alias="variableMappings")
    parameter_mappings: dict[str, str] = Field(serialization_alias="parameterMappings")
    context: dict[str, float]
    required_inputs: list[str] = Field(serialization_alias="requiredInputs")


class SimulationResult(_CamelModel):
    times: list[float]
    series: dict[str, list[float]]
