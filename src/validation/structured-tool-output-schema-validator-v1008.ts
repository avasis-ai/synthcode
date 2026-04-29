import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaDefinition = Record<string, FieldSchema>;

interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  items?: FieldSchema;
  properties?: Record<string, FieldSchema>;
  validate?: (value: unknown, payload: Record<string, unknown>) => boolean;
}

interface ValidatorResult {
  isValid: boolean;
  errors: string[];
}

export class StructuredToolOutputSchemaValidatorV1008 {
  private schema: SchemaDefinition;

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  public validate(payload: Record<string, unknown>): ValidatorResult {
    const errors: string[] = [];
    const result: Record<string, unknown> = {};

    this.validateObject(this.schema, payload, result, errors);

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateObject(
    schema: FieldSchema,
    payload: Record<string, unknown>,
    result: Record<string, unknown>,
    errors: string[]
  ): void {
    if (schema.type !== "object" || !schema.properties) {
      return;
    }

    const properties = schema.properties;

    for (const key in properties) {
      const fieldSchema = properties[key];
      const value = payload[key];
      const path = key;

      if (fieldSchema.required && value === undefined) {
        errors.push(`${path}: is required.`);
        continue;
      }

      if (value === undefined) {
        result[key] = undefined;
        continue;
      }

      if (typeof value !== "object" || value === null) {
        if (fieldSchema.type !== "object") {
          errors.push(`${path}: expected object, got ${typeof value}.`);
        }
        continue;
      }

      if (fieldSchema.type === "object") {
        this.validateObject(fieldSchema, value as Record<string, unknown>, result[key] as Record<string, unknown>, errors);
      } else if (fieldSchema.type === "array") {
        this.validateArray(fieldSchema, value as unknown, result[key] as unknown, errors);
      } else {
        this.validatePrimitive(fieldSchema, value, path, errors);
      }
    }

    // Cross-field validation
    if (schema.validate) {
      if (!schema.validate(payload, payload)) {
        errors.push("Cross-field validation failed based on schema rules.");
      }
    }
  }

  private validateArray(
    schema: FieldSchema,
    payload: unknown,
    result: unknown,
    errors: string[]
  ): void {
    if (schema.type !== "array" || !schema.items) {
      return;
    }

    if (!Array.isArray(payload)) {
      errors.push("Expected an array.");
      return;
    }

    const itemSchema = schema.items;
    const arrayResult: unknown[] = [];

    for (let i = 0; i < payload.length; i++) {
      const item = payload[i];
      const path = `[${i}]`;
      const itemResult: unknown = {};
      const itemErrors: string[] = [];

      if (typeof itemSchema.type === "object" && itemSchema.properties) {
        this.validateObject(itemSchema, item as Record<string, unknown>, itemResult as Record<string, unknown>, itemErrors);
      } else {
        this.validatePrimitive(itemSchema, item, path, itemErrors);
      }

      if (itemErrors.length > 0) {
        errors.push(...itemErrors.map(err => `${path}: ${err}`));
      }
      arrayResult.push(itemResult);
    }
    (result as unknown) = arrayResult;
  }

  private validatePrimitive(
    schema: FieldSchema,
    value: unknown,
    path: string,
    errors: string[]
  ): void {
    const type = schema.type;

    if (type === "string") {
      if (typeof value !== "string") {
        errors.push(`${path}: expected string, got ${typeof value}.`);
        return;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push(`${path}: minimum length is ${schema.minLength}.`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push(`${path}: maximum length is ${schema.maxLength}.`);
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: must be one of ${schema.enum.join(', ')}.`);
      }
    } else if (type === "number") {
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`${path}: expected number, got ${typeof value}.`);
        return;
      }
    } else if (type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push(`${path}: expected boolean, got ${typeof value}.`);
        return;
      }
    }
  }
}