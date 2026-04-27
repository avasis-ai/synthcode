import {
  ToolUseBlock,
  ToolUseId,
  ToolDefinition,
} from "./tool-types";

export type SchemaDriftReport = {
  field: string;
  expectedType: string;
  actualType: string;
  isMissing: boolean;
  isExtra: boolean;
};

export class ToolInputSchemaDriftDetector {
  private expectedSchema: Record<string, { type: string }>;

  constructor(expectedSchema: Record<string, { type: string }>) {
    this.expectedSchema = expectedSchema;
  }

  private inferSchema(input: Record<string, unknown>): Record<string, { type: string }> {
    const inferredSchema: Record<string, { type: string }> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        const value = input[key];
        let type: string;

        if (Array.isArray(value)) {
          // Simplification: Assume array of primitives or objects for type inference
          if (value.length === 0) {
            type = "unknown[]";
          } else if (typeof value[0] === "string") {
            type = "string[]";
          } else if (typeof value[0] === "number") {
            type = "number[]";
          } else if (typeof value[0] === "boolean") {
            type = "boolean[]";
          } else {
            type = "object[]";
          }
        } else if (typeof value === "string") {
          type = "string";
        } else if (typeof value === "number") {
          type = "number";
        } else if (typeof value === "boolean") {
          type = "boolean";
        } else if (value === null) {
          type = "null";
        } else if (typeof value === "object" && value !== null) {
          // Basic object type inference (recursive schema inference omitted for brevity/scope)
          type = "object";
        } else {
          type = "unknown";
        }
        inferredSchema[key] = { type: type };
      }
    }
    return inferredSchema;
  }

  public detectDrift(runtimeInput: Record<string, unknown>): SchemaDriftReport[] {
    const actualSchema = this.inferSchema(runtimeInput);
    const driftReport: SchemaDriftReport[] = [];

    // 1. Check for missing or type mismatches in expected fields
    for (const [field, expected] of Object.entries(this.expectedSchema)) {
      const actual = actualSchema[field];

      if (!actual) {
        driftReport.push({
          field: field,
          expectedType: expected.type,
          actualType: "missing",
          isMissing: true,
          isExtra: false,
        });
        continue;
      }

      if (actual.type !== expected.type && !actual.type.includes("unknown")) {
        driftReport.push({
          field: field,
          expectedType: expected.type,
          actualType: actual.type,
          isMissing: false,
          isExtra: false,
        });
      }
    }

    // 2. Check for extra fields in runtime input
    for (const field in actualSchema) {
      if (Object.prototype.hasOwnProperty.call(actualSchema, field) &&
        !Object.prototype.hasOwnProperty.call(this.expectedSchema, field)) {
        driftReport.push({
          field: field,
          expectedType: "N/A",
          actualType: actualSchema[field].type,
          isMissing: false,
          isExtra: true,
        });
      }
    }

    return driftReport;
  }
}