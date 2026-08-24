import type { EngineInterface } from "../types";
import { compile } from "./compile";
import { simulate } from "./simulate";

export const mockEngine: EngineInterface = { compile, simulate };
