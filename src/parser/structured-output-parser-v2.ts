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

interface JsonSchema {
  type: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: {
    [key: string]: JsonSchema;
  };
  items?: JsonSchema;
  required?: string[];
  description?: string;
  additionalProperties?: JsonSchema;
}

interface ParseResult {
  success: boolean;
  data: unknown | null;
  errors: string[];
}

export class StructuredOutputParserV2 {
  private schema: JsonSchema;

  constructor(schema: JsonSchema) {
    this.schema = schema;
  }

  private validateAndParseValue(
    value: unknown,
    schema: JsonSchema,
    path: string,
  ): { valid: boolean; parsed: unknown; errors: string[] } {
    const errors: string[] = [];
    let parsed: unknown = value;

    if (schema.type === "object") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push(`Expected object at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }

      const properties = schema.properties || {};
      const required = schema.required || [];

      // Check for missing required properties
      for (const prop of required) {
        if (!(prop in value)) {
          errors.push(`Missing required property '${prop}' at ${path}.`);
        }
      }

      // Validate properties
      for (const key in properties) {
        const propSchema = properties[key];
        const propValue = (value as Record<string, unknown>)[key];
        const propPath = `${path}.${key}`;

        if (propValue === undefined) continue;

        const { valid: propValid, parsed: propParsed, errors: propErrors } =
          this.validateAndParseValue(propValue, propSchema, propPath);

        if (!propValid) {
          errors.push(...propErrors);
        } else {
          // In a real scenario, we would merge propParsed into the final object structure
          // For simplicity here, we just ensure the structure is sound.
        }
      }
      return { valid: errors.length === 0, parsed: value, errors };
    }

    if (schema.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`Expected array at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }

      const itemsSchema = schema.items;
      const parsedArray: unknown[] = [];

      for (let i = 0; i < value.length; i++) {
        const itemValue = value[i];
        const itemPath = `${path}[${i}]`;
        const { valid: itemValid, parsed: itemParsed, errors: itemErrors } =
          this.validateAndParseValue(itemValue, itemsSchema || { type: "any" }, itemPath);

        if (!itemValid) {
          errors.push(...itemErrors);
        } else {
          parsedArray.push(itemParsed);
        }
      }
      return { valid: errors.length === 0, parsed: parsedArray, errors };
    }

    if (schema.type === "string") {
      if (typeof value !== "string") {
        errors.push(`Expected string at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }
      return { valid: true, parsed: value, errors: [] };
    }

    if (schema.type === "number") {
      if (typeof value !== "number" || isNaN(value)) {
        errors.push(`Expected number at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }
      return { valid: true, parsed: value, errors: [] };
    }

    if (schema.type === "boolean") {
      if (typeof value !== "boolean") {
        errors.push(`Expected boolean at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }
      return { valid: true, parsed: value, errors: [] };
    }

    if (schema.type === "null") {
      if (value !== null) {
        errors.push(`Expected null at ${path}, but got ${typeof value}.`);
        return { valid: false, parsed: null, errors };
      }
      return { valid: true, parsed: null, errors: [] };
    }

    // Fallback for unknown types or successful primitive match
    return { valid: true, parsed: value, errors: [] };
  }

  public parse(inputJsonString: string): ParseResult {
    let inputData: unknown;
    try {
      inputData = JSON.parse(inputJsonString);
    } catch (e) {
      return {
        success: false,
        data: null,
        errors: ["Invalid JSON format: " + (e as Error).message],
      };
    }

    const { valid, parsed, errors } =
      this.validateAndParseValue(inputData, this.schema, "root");

    return {
      success: valid,
      data: parsed,
      errors: errors,
    };
  }
}