import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type SchemaDefinition = Record<string, SchemaItem>;

interface SchemaItem {
  type: "object" | "array" | "string" | "number" | "boolean";
  required?: string[];
  properties?: Record<string, SchemaItem>;
  items?: SchemaItem;
  constraints?: {
    [key: string]: (value: unknown, data: Record<string, unknown>) => boolean;
  };
}

type ValidatorResult = {
  isValid: boolean;
  errors: string[];
};

export class StructuredToolOutputSchemaValidatorV1001 {
  private schema: SchemaDefinition;

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  private validateType(value: unknown, expectedType: SchemaItem["type"]): boolean {
    if (expectedType === "object") {
      return typeof value === "object" && value !== null && !Array.isArray(value);
    }
    if (expectedType === "array") {
      return Array.isArray(value);
    }
    if (expectedType === "string") {
      return typeof value === "string";
    }
    if (expectedType === "number") {
      return typeof value === "number" && !isNaN(value);
    }
    if (expectedType === "boolean") {
      return typeof value === "boolean";
    }
    return false;
  }

  private validateObject(data: Record<string, unknown>, schema: SchemaItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push(`Missing required field: ${field}`);
          isValid = false;
        }
      }
    }

    if (schema.properties) {
      for (const key in schema.properties) {
        const propSchema = schema.properties[key];
        const value = data[key];

        if (value === undefined || value === null) continue;

        if (!this.validateType(value, propSchema.type)) {
          errors.push(`Field '${key}' has incorrect type. Expected ${propSchema.type}, got ${typeof value}.`);
          isValid = false;
          continue;
        }

        if (propSchema.type === "object") {
          const nestedResult = this.validateObject(value as Record<string, unknown>, propSchema as SchemaItem);
          if (!nestedResult.isValid) {
            errors.push(...Object.keys(nestedResult.errors).map(e => `[${key}] ${e}`));
            isValid = false;
          }
        } else if (propSchema.type === "array") {
          if (!Array.isArray(value)) {
            errors.push(`Field '${key}' expected array but got ${typeof value}.`);
            isValid = false;
          } else {
            const itemSchema = propSchema.items!;
            for (let i = 0; i < value.length; i++) {
              const itemValue = value[i];
              if (!this.validateType(itemValue, itemSchema.type)) {
                errors.push(`Array item at index ${i} in '${key}' has incorrect type. Expected ${itemSchema.type}.`);
                isValid = false;
              }
            }
          }
        }
      }
    }

    // Cross-field constraints
    if (schema.constraints) {
      for (const constraintName in schema.constraints) {
        const constraintFn = schema.constraints[constraintName];
        if (!constraintFn(data, data)) {
          errors.push(`Failed custom constraint: ${constraintName}`);
          isValid = false;
        }
      }
    }

    return { isValid, errors: [...new Set(errors)] };
  }

  public validate(data: unknown): ValidatorResult {
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Input data must be a non-null object."] };
    }

    const result = this.validateObject(data as Record<string, unknown>, this.schema);

    return {
      isValid: result.isValid,
      errors: result.errors,
    };
  }

  public addConstraint(constraintName: string, constraintFn: (value: unknown, data: Record<string, unknown>) => boolean): this {
    // In a real implementation, this would dynamically update the schema or use a builder pattern state.
    // For this constrained example, we assume the schema is built correctly beforehand.
    // We return 'this' to maintain the fluent interface style.
    return this;
  }
}