import { z } from "zod";

export type TemporalConstraint = "start_before_end" | "sequence_must_increment";

export interface TemporalSchemaField {
  type: "temporal";
  constraints: Record<TemporalConstraint, { field1: string; field2: string }>;
}

export interface StructuredSchemaField {
  type: "object";
  properties: Record<string, SchemaField>;
  required: string[];
}

export type SchemaField =
  | { type: "string"; constraints?: { min?: number; max?: number } }
  | { type: "number"; constraints?: { min?: number; max?: number } }
  | { type: "object"; schema: StructuredSchemaField }
  | { type: "temporal"; schema: StructuredSchemaField };

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class StructuredToolInputSchemaValidatorV37 {
  validate(
    input: Record<string, unknown>,
    schema: StructuredSchemaField
  ): ValidationResult {
    const errors: string[] = [];
    this.validateObject(input, schema, "", errors);
    return { isValid: errors.length === 0, errors };
  }

  private validateObject(
    input: Record<string, unknown>,
    schema: StructuredSchemaField,
    path: string,
    errors: string[]
  ): void {
    const properties = schema.properties;
    const required = schema.required || [];

    // Check for required fields
    for (const field of required) {
      if (!(field in input) || input[field] === null || input[field] === undefined) {
        errors.push(`${path}.${field}: is required`);
      }
    }

    // Validate properties
    for (const key in properties) {
      const fieldSchema = properties[key];
      const value = input[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (value === undefined || value === null) {
        continue; // Already checked if required
      }

      if (fieldSchema.type === "object") {
        if (typeof value === "object" && value !== null) {
          this.validateObject(value as Record<string, unknown>, fieldSchema.schema, currentPath, errors);
        } else {
          errors.push(`${currentPath}: expected object`);
        }
      } else if (fieldSchema.type === "temporal") {
        if (typeof value === "object" && value !== null) {
          this.validateTemporal(value as Record<string, unknown>, fieldSchema.schema, currentPath, errors);
        } else {
          errors.push(`${currentPath}: expected object for temporal validation`);
        }
      } else if (fieldSchema.type === "string") {
        if (typeof value === "string") {
          if (fieldSchema.constraints?.min !== undefined && value.length < fieldSchema.constraints.min) {
            errors.push(`${currentPath}: must be at least ${fieldSchema.constraints.min} characters long`);
          }
          if (fieldSchema.constraints?.max !== undefined && value.length > fieldSchema.constraints.max) {
            errors.push(`${currentPath}: must be at most ${fieldSchema.constraints.max} characters long`);
          }
        } else {
          errors.push(`${currentPath}: expected string`);
        }
      } else if (fieldSchema.type === "number") {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (fieldSchema.constraints?.min !== undefined && numValue < fieldSchema.constraints.min) {
            errors.push(`${currentPath}: must be greater than or equal to ${fieldSchema.constraints.min}`);
          }
          if (fieldSchema.constraints?.max !== undefined && numValue > fieldSchema.constraints.max) {
            errors.push(`${currentPath}: must be less than or equal to ${fieldSchema.constraints.max}`);
          }
        } else {
          errors.push(`${currentPath}: expected number`);
        }
      }
    }
  }

  private validateTemporal(
    input: Record<string, unknown>,
    schema: StructuredSchemaField,
    path: string,
    errors: string[]
  ): void {
    const properties = schema.properties;

    // 1. Basic object structure validation (recursively)
    for (const key in properties) {
      const fieldSchema = properties[key];
      const value = input[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (fieldSchema.type === "object") {
        if (typeof value === "object" && value !== null) {
          this.validateObject(value as Record<string, unknown>, fieldSchema.schema, currentPath, errors);
        } else {
          errors.push(`${currentPath}: expected object`);
        }
      }
    }

    // 2. Cross-field temporal constraint validation
    const temporalSchema = schema as any; // Assume schema structure allows temporal constraints check
    const constraints = temporalSchema.constraints;

    if (!constraints) return;

    for (const constraintType in constraints) {
      const constraint = constraints[constraintType];
      const { field1, field2 } = constraint;

      const val1 = input[field1];
      const val2 = input[field2];

      if (val1 === undefined || val2 === undefined) {
        continue;
      }

      try {
        let isValid = true;
        if (constraintType === "start_before_end") {
          const start = Number(val1);
          const end = Number(val2);
          if (isNaN(start) || isNaN(end)) {
            throw new Error("Temporal values must be valid numbers.");
          }
          if (start >= end) {
            isValid = false;
          }
        } else if (constraintType === "sequence_must_increment") {
          const seq1 = Number(val1);
          const seq2 = Number(val2);
          if (isNaN(seq1) || isNaN(seq2)) {
            throw new Error("Sequence values must be valid integers.");
          }
          if (seq2 !== seq1 + 1) {
            isValid = false;
          }
        }

        if (!isValid) {
          errors.push(
            `${path}: Temporal constraint violation (${constraintType}). ${field1} (${val1}) must precede ${field2} (${val2}) or sequence must increment.`
          );
        }
      } catch (e) {
        errors.push(`${path}: Failed to validate temporal constraint (${constraintType}): ${(e as Error).message}`);
      }
    }
  }
}