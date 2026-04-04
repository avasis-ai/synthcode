import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

interface SchemaDefinition {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
}

export class ToolOutputSchemaValidator {
  constructor(private schema: SchemaDefinition) {}

  validate(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const result: { isValid: boolean; errors: string[] } = this.validateRecursive(data, this.schema, "root");

    if (!result.isValid) {
      errors.push(...result.errors);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : [],
    };
  }

  private validateRecursive(
    data: unknown,
    schema: SchemaDefinition,
    path: string
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (schema.type === "object") {
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        errors.push(`Expected object at ${path}, but got ${typeof data}.`);
        return { isValid: false, errors };
      }

      const properties = schema.properties || {};
      const required = schema.required || [];

      // Check for required fields
      for (const key of required) {
        if (!(key in data) || data[key] === undefined || data[key] === null) {
          errors.push(`Missing required property '${key}' at ${path}.`);
          isValid = false;
        }
      }

      // Check properties
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const propSchema = properties[key];
          const propValue = data[key];
          const newPath = `${path}.${key}`;

          if (propValue === undefined || propValue === null) {
            continue; // Handled by required check if necessary
          }

          const subResult = this.validateRecursive(propValue, propSchema, newPath);
          if (!subResult.isValid) {
            errors.push(...subResult.errors);
            isValid = false;
          }
        }
      }
    } else if (schema.type === "string") {
      if (typeof data !== "string") {
        errors.push(`Expected string at ${path}, but got ${typeof data}.`);
        isValid = false;
      }
    } else if (schema.type === "number") {
      if (typeof data !== "number" || isNaN(data)) {
        errors.push(`Expected number at ${path}, but got ${typeof data}.`);
        isValid = false;
      }
    } else if (schema.type === "boolean") {
      if (typeof data !== "boolean") {
        errors.push(`Expected boolean at ${path}, but got ${typeof data}.`);
        isValid = false;
      }
    } else if (schema.type === "array") {
      if (!Array.isArray(data)) {
        errors.push(`Expected array at ${path}, but got ${typeof data}.`);
        isValid = false;
      } else if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          const itemPath = `${path}[${i}]`;
          const subResult = this.validateRecursive(data[i], schema.items, itemPath);
          if (!subResult.isValid) {
            errors.push(...subResult.errors);
            isValid = false;
          }
        }
      }
    } else {
      errors.push(`Unsupported schema type defined for ${path}: ${schema.type}`);
      isValid = false;
    }

    return { isValid, errors: errors };
  }
}