import { ValidatorContext, ValidationResult } from "./validator-context";

export interface SchemaConstraint {
  ifCondition: (data: Record<string, unknown>) => boolean;
  thenConstraint: (data: Record<string, unknown>) => ValidationResult | undefined;
}

export interface FieldSchema {
  type: "object" | "string" | "number" | "boolean";
  required?: boolean;
  constraints?: SchemaConstraint[];
  properties?: Record<string, FieldSchema>;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface StructuredSchema {
  [key: string]: FieldSchema;
}

export class StructuredToolOutputSchemaValidator {
  private schema: StructuredSchema;

  constructor(schema: StructuredSchema) {
    this.schema = schema;
  }

  public validate(data: Record<string, unknown>, context: ValidatorContext): ValidationResult {
    const results: ValidationResult[] = [];
    this.validateObject(data, this.schema, context, results);
    return {
      isValid: results.length === 0,
      errors: results,
    };
  }

  private validateObject(
    data: Record<string, unknown>,
    schema: StructuredSchema,
    context: ValidatorContext,
    results: ValidationResult[]
  ): void {
    for (const key in schema) {
      if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;

      const fieldSchema = schema[key];
      const value = data[key];
      const isPresent = Object.prototype.hasOwnProperty.call(data, key);

      if (fieldSchema.required && !isPresent) {
        results.push({
          field: key,
          message: `${key} is required but missing.`,
          severity: "error",
        });
        continue;
      }

      if (!isPresent) continue;

      // 1. Check basic type constraints
      if (!this.checkBasicType(value, fieldSchema.type)) {
        results.push({
          field: key,
          message: `Invalid type for ${key}. Expected ${fieldSchema.type}.`,
          severity: "error",
        });
        continue;
      }

      // 2. Check complex constraints (e.g., if/then)
      if (fieldSchema.constraints) {
        for (const constraint of fieldSchema.constraints) {
          if (constraint.ifCondition(data)) {
            const thenResult = constraint.thenConstraint(data);
            if (thenResult && !thenResult.isValid) {
              results.push({
                field: key,
                message: `Constraint failed: ${thenResult.message}`,
                severity: "error",
              });
            }
          }
        }
      }

      // 3. Recurse for objects
      if (fieldSchema.type === "object" && typeof value === "object" && value !== null) {
        const nestedSchema = fieldSchema as any; // Assume properties define the structure
        const nestedData = value as Record<string, unknown>;
        this.validateObject(nestedData, nestedSchema.properties || {} as StructuredSchema, context, results);
      }
    }
  }

  private checkBasicType(value: unknown, expectedType: "object" | "string" | "number" | "boolean"): boolean {
    if (expectedType === "string") {
      return typeof value === "string";
    }
    if (expectedType === "number") {
      return typeof value === "number" && !isNaN(value);
    }
    if (expectedType === "boolean") {
      return typeof value === "boolean";
    }
    if (expectedType === "object") {
      return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    return false;
  }
}