// Re-export the typed Zod schemas. The orval generator emits the same
// `*Body` schemas in both ./generated/api.ts (alongside the operation
// definitions) and ./generated/types/* (one file per schema). Re-exporting
// both with `export *` produced duplicate-name conflicts for shared
// request body schemas, so we re-export the per-schema files under a
// dedicated `schemas` namespace and keep the operations + zod schemas
// from ./generated/api.ts at the top level.
export * from "./generated/api";
export * as schemas from "./generated/types";
