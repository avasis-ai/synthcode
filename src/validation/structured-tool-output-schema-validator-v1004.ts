import { ValidatorBase } from "./validator-base";

export interface SchemaDefinition {
  type: "object";
  properties: Record<string, FieldSchema>;
  required: string[];
  dependencies?: Record<string, {
    dependsOn: string;
    constraint: (a: any, b: any) => boolean;
    message: string;
  }[]);
}

export interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  description?: string;
  // Custom constraints for cross-field validation
  constraints?: {
    type: "temporal";
    fieldA: string;
    fieldB: string;
    timeWindowMs: number;
    message: string;
  }[]
}

export interface ToolOutputSchemaValidatorV1004 extends ValidatorBase {
  validate(
    output: Record<string, unknown>,
    schema: SchemaDefinition
  ): { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputSchemaValidatorV1004 implements ToolOutputSchemaValidatorV1004 {
  validate(
    output: Record<string, unknown>,
    schema: SchemaDefinition
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof output !== "object" || output === null) {
      return { isValid: false, errors: ["Output must be a non-null object."] };
    }

    // 1. Check required fields and basic types
    const propertyErrors = this.validateObjectProperties(output, schema);
    errors.push(...propertyErrors);

    // 2. Check cross-field dependencies (if provided in schema)
    if (schema.dependencies) {
      for (const [field, dependencies] of Object.entries(schema.dependencies)) {
        for (const dep of dependencies) {
          if (output[field] !== undefined && output[dep.dependsOn] !== undefined) {
            const a = output[field];
            const b = output[dep.dependsOn];
            if (!dep.constraint(a, b)) {
              errors.push(dep.message);
            }
          }
        }
      }
    }

    // 3. Check temporal constraints (specific cross-field logic)
    if (schema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        if (fieldSchema.constraints) {
          for (const constraint of fieldSchema.constraints) {
            const valueA = output[constraint.fieldA];
            const valueB = output[constraint.fieldB];

            if (valueA !== undefined && valueB !== undefined) {
              const isTemporalValid = this.checkTemporalConstraint(
                valueA,
                valueB,
                constraint.timeWindowMs
              );
              if (!isTemporalValid) {
                errors.push(constraint.message);
              }
            }
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateObjectProperties(
    output: Record<string, unknown>,
    schema: SchemaDefinition
  ): string[] {
    const errors: string[] = [];
    const properties = schema.properties || {} as Record<string, FieldSchema>;

    // Check for missing required fields
    (schema.required || []).forEach(requiredField => {
      if (output[requiredField] === undefined || output[requiredField] === null) {
        errors.push(`Missing required field: ${requiredField}`);
      }
    });

    // Check properties
    for (const [key, fieldSchema] of Object.entries(properties)) {
      if (output[key] === undefined || output[key] === null) {
        continue;
      }

      const value = output[key];
      if (fieldSchema.type === "object") {
        // Recursive validation for nested objects would go here
      } else if (fieldSchema.type === "string") {
        // Basic type check for string
        if (typeof value !== "string") {
          errors.push(`Field ${key} expected type string, got ${typeof value}`);
        }
      }
    }
    return errors;
  }

  private checkTemporalConstraint(
    valueA: unknown,
    valueB: unknown,
    timeWindowMs: number
  ): boolean {
    const isNumber = (val: unknown): val is number => typeof val === 'number' && !isNaN(val);

    if (!isNumber(valueA) || !isNumber(valueB)) {
      return false; // Cannot perform temporal check if inputs are not numbers (timestamps)
    }

    const timeDifference = Math.abs(valueA - valueB);
    return Math.abs(timeDifference) <= timeWindowMs;
  }
}