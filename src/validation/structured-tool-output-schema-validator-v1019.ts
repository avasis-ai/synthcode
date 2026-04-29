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

type SchemaDefinition = {
  type: "object";
  properties: Record<string, SchemaDefinition>;
  required: string[];
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class StructuredToolOutputSchemaValidatorV1019 {
  private schema: SchemaDefinition;

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  private validateObject(data: Record<string, unknown>, schema: SchemaDefinition, path: string = ""): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (schema.type !== "object") {
      result.isValid = false;
      result.errors.push(`Expected object schema at ${path}, but got type: ${schema.type}`);
      return result;
    }

    const properties = schema.properties;
    const required = schema.required || [];

    // Check for required properties
    for (const key of required) {
      if (!(key in data) || data[key] === null || typeof data[key] === "undefined") {
        result.isValid = false;
        result.errors.push(`Missing required property: ${key} at ${path}`);
      }
    }

    // Check all properties against schema
    for (const key in properties) {
      const propSchema = properties[key];
      const value = data[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (value === null || typeof value === "undefined") {
        continue; // Handled by required check if necessary
      }

      if (propSchema.type === "object" && typeof value === "object" && !Array.isArray(value)) {
        const nestedResult = this.validateObject(value as Record<string, unknown>, propSchema, currentPath);
        if (!nestedResult.isValid) {
          result.isValid = false;
          result.errors.push(...nestedResult.errors);
        }
      } else if (propSchema.type === "string" && typeof value !== "string") {
        result.isValid = false;
        result.errors.push(`Expected string at ${currentPath}, but got ${typeof value}`);
      } else if (propSchema.type === "number" && typeof value !== "number") {
        result.isValid = false;
        result.errors.push(`Expected number at ${currentPath}, but got ${typeof value}`);
      }
      // Add more type checks as needed (e.g., array validation)
    }

    return result;
  }

  public validate(data: unknown): ValidationResult {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { isValid: false, errors: ["Input data must be a non-array object."] };
    }

    const result = this.validateObject(data as Record<string, unknown>, this.schema);

    if (!result.isValid) {
      return { isValid: false, errors: result.errors };
    }

    return { isValid: true, errors: [] };
  }
}