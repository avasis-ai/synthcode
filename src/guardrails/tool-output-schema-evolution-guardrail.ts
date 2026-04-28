import {
  ToolResultMessage,
  Message,
} from "./types";

type EvolutionRule = "additive" | "optional_type_change" | "strict";

interface SchemaEvolutionGuardrailOptions {
  targetSchema: Record<string, any>;
  allowedRules: EvolutionRule[];
}

interface SchemaEvolutionWarning {
  field: string;
  message: string;
  severity: "warning" | "error";
}

export class SchemaEvolutionGuardrail {
  private options: SchemaEvolutionGuardrailOptions;

  constructor(options: SchemaEvolutionGuardrailOptions) {
    this.options = options;
  }

  private validateField(
    data: Record<string, unknown>,
    schema: Record<string, any>,
    path: string,
  ): SchemaEvolutionWarning[] {
    const warnings: SchemaEvolutionWarning[] = [];

    if (typeof schema.type !== "string") {
      return warnings;
    }

    const expectedType = schema.type;
    const actualValue = data[path];

    if (actualValue === undefined) {
      if (expectedType !== "optional") {
        warnings.push({
          field: path,
          message: `Missing required field '${path}' with expected type '${expectedType}'.`,
          severity: "error",
        });
      }
      return warnings;
    }

    // Simplified type checking for demonstration
    const actualType = typeof actualValue;
    if (expectedType === "string" && actualType !== "string") {
      warnings.push({
        field: path,
        message: `Type mismatch for '${path}'. Expected 'string', got '${actualType}'.`,
        severity: "warning",
      });
    } else if (expectedType === "number" && actualType !== "number") {
      warnings.push({
        field: path,
        message: `Type mismatch for '${path}'. Expected 'number', got '${actualType}'.`,
        severity: "warning",
      });
    }
    // Add more complex type checks as needed

    return warnings;
  }

  public validateOutput(
    toolOutput: ToolResultMessage,
  ): {
    isValid: boolean;
    warnings: SchemaEvolutionWarning[];
    adaptedOutput: Record<string, unknown>;
  } {
    const warnings: SchemaEvolutionWarning[] = [];
    const adaptedOutput: Record<string, unknown> = { ...toolOutput };
    let isValid = true;

    // 1. Validate against the target schema structure (simplified: assuming toolOutput maps directly to schema keys)
    const schemaKeys = Object.keys(this.options.targetSchema);

    for (const key of schemaKeys) {
      const schema = this.options.targetSchema[key];
      const path = key;

      const fieldWarnings = this.validateField(
        toolOutput,
        schema,
        path,
      );
      warnings.push(...fieldWarnings);
    }

    // 2. Apply evolution rules logic (Highly simplified for this scope)
    if (this.options.allowedRules.includes("strict")) {
      if (warnings.some((w) => w.severity === "error")) {
        isValid = false;
      }
    } else if (this.options.allowedRules.includes("additive")) {
      // Additive rule allows extra fields in the output that aren't in the schema,
      // but we primarily check for missing required fields.
    }

    // 3. Determine final validity and adaptation
    if (warnings.some((w) => w.severity === "error")) {
      isValid = false;
    }

    // In a real scenario, adaptation would involve coercing types or filling defaults based on rules.
    // Here, we just return the original output as the 'adapted' one if validation passes enough.
    return {
      isValid: isValid,
      warnings: warnings,
      adaptedOutput: adaptedOutput,
    };
  }
}