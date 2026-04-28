import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface SchemaField {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: string[];
  // Add other constraints as needed for a real-world scenario
}

export interface SchemaDefinition {
  [key: string]: SchemaField;
}

export interface SchemaDiffReport {
  field: string;
  diffType: "TYPE_CHANGE" | "REQUIRED_CHANGE" | "CONSTRAINT_CHANGE" | "MISSING_FIELD" | "EXTRA_FIELD";
  message: string;
  details?: any;
}

export interface DiffResult {
  diffReport: SchemaDiffReport[];
  isDriftDetected: boolean;
}

export class StructuredToolOutputSchemaDiffer {
  private compareSchemas(
    previousSchema: SchemaDefinition,
    currentSchema: SchemaDefinition
  ): {
    diffReport: SchemaDiffReport[];
    isDriftDetected: boolean;
  } {
    const diffReport: SchemaDiffReport[] = [];
    let driftDetected = false;

    const allKeys = new Set<string>([
      ...Object.keys(previousSchema),
      ...Object.keys(currentSchema),
    ]);

    for (const key of allKeys) {
      const prevField = previousSchema[key];
      const currField = currentSchema[key];

      if (!prevField && currField) {
        diffReport.push({
          field: key,
          diffType: "EXTRA_FIELD",
          message: `Field '${key}' exists in the current schema but was not present in the previous schema.`,
        });
        driftDetected = true;
        continue;
      }

      if (prevField && !currField) {
        diffReport.push({
          field: key,
          diffType: "MISSING_FIELD",
          message: `Field '${key}' was present in the previous schema but is missing in the current schema.`,
        });
        driftDetected = true;
        continue;
      }

      if (prevField && currField) {
        // 1. Type Check
        if (prevField.type !== currField.type) {
          diffReport.push({
            field: key,
            diffType: "TYPE_CHANGE",
            message: `Field type changed from '${prevField.type}' to '${currField.type}'.`,
            details: {
              previousType: prevField.type,
              currentType: currField.type,
            },
          });
          driftDetected = true;
        }

        // 2. Required Status Check
        const prevRequired = prevField.required ?? false;
        const currRequired = currField.required ?? false;

        if (prevRequired !== currRequired) {
          diffReport.push({
            field: key,
            diffType: "REQUIRED_CHANGE",
            message: `Required status changed from ${prevRequired ? "true" : "false"} to ${currRequired ? "true" : "false"}.`,
            details: {
              previousRequired: prevRequired,
              currentRequired: currRequired,
            },
          });
          driftDetected = true;
        }

        // 3. Constraint Check (Simplified: checking for enum change)
        const prevEnum = prevField.enum;
        const currEnum = currField.enum;

        if (prevEnum && currEnum && JSON.stringify(prevEnum.sort()) !== JSON.stringify(currEnum.sort())) {
          diffReport.push({
            field: key,
            diffType: "CONSTRAINT_CHANGE",
            message: `Enum constraints changed.`,
            details: {
              previousEnums: prevEnum,
              currentEnums: currEnum,
            },
          });
          driftDetected = true;
        }
      }
    }

    return { diffReport, isDriftDetected: driftDetected };
  }

  /**
   * Compares two schema definitions based on structural changes.
   * @param previousSchema The schema from the previous tool output.
   * @param currentSchema The schema from the current tool output.
   * @returns A DiffResult containing the report and a boolean indicating drift.
   */
  public compareSchemas(
    previousSchema: SchemaDefinition,
    currentSchema: SchemaDefinition
  ): DiffResult {
    return this.compareSchemas(previousSchema, currentSchema);
  }

  /**
   * Analyzes the schema drift using a sample payload to check for type mismatches
   * that might not be caught by schema comparison alone (e.g., number passed as string).
   * @param previousSchema The expected schema.
   * @param currentSchema The observed schema.
   * @param samplePayload A sample object conforming to the structure.
   * @returns A DiffResult containing the report and a boolean indicating drift.
   */
  public analyzeSchemaWithPayload(
    previousSchema: SchemaDefinition,
    currentSchema: SchemaDefinition,
    samplePayload: Record<string, unknown>
  ): DiffResult {
    const schemaDiff = this.compareSchemas(previousSchema, currentSchema);
    const payloadDiffReport: SchemaDiffReport[] = [];
    let payloadDriftDetected = false;

    for (const key in samplePayload) {
      if (!Object.prototype.hasOwnProperty.call(samplePayload, key)) continue;

      const value = samplePayload[key];
      const prevField = previousSchema[key];
      const currField = currentSchema[key];

      if (!prevField && !currField) continue;

      if (prevField && currField) {
        // Check if the value type matches the expected current schema type
        const actualType = typeof value;
        const expectedType = currField.type;

        if (expectedType === "number" && actualType === "string" && !isNaN(Number(value))) {
          // This is a potential coercion issue, but for strict diffing, we flag it if the schema expects a primitive type.
        }

        if (expectedType === "number" && actualType === "string" && isNaN(Number(value))) {
          payloadDiffReport.push({
            field: key,
            diffType: "TYPE_CHANGE",
            message: `Payload value '${value}' cannot be coerced to the expected 'number' type.`,
            details: {
              expected: "number",
              actual: typeof value,
            },
          });
          payloadDriftDetected = true;
        } else if (expectedType === "boolean" && typeof value !== "boolean") {
          payloadDiffReport.push({
            field: key,
            diffType: "TYPE_CHANGE",
            message: `Payload value '${value}' cannot be coerced to the expected 'boolean' type.`,
            details: {
              expected: "boolean",
              actual: typeof value,
            },
          });
          payloadDriftDetected = true;
        }
      }
    }

    const finalReport = [
      ...schemaDiff.diffReport,
      ...payloadDiffReport,
    ];

    return {
      diffReport: finalReport,
      isDriftDetected: schemaDiff.isDriftDetected || payloadDriftDetected,
    };
  }
}