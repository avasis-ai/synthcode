import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaDefinition = {
  type: "object" | "array" | "string" | "number" | "boolean" | "enum";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  enum?: string[];
  description?: string;
};

type ValidationContext = {
  dataPath: string;
};

type ValidationError = {
  path: string;
  message: string;
  schemaPath: string;
};

export class StructuredToolOutputValidator {
  private schema: SchemaDefinition;
  private context: ValidationContext;

  constructor(schema: SchemaDefinition, context: ValidationContext) {
    this.schema = schema;
    this.context = context;
  }

  private validatePrimitive(data: unknown, schema: SchemaDefinition): { isValid: boolean; error?: ValidationError } {
    if (typeof data !== "string" && (schema.type !== "any" as const)) {
      return { isValid: false, error: { path: this.context.dataPath, message: `Expected ${schema.type} but got ${typeof data}`, schemaPath: "primitive" } };
    }

    if (schema.type === "string") {
      if (typeof data !== "string") {
        return { isValid: false, error: { path: this.context.dataPath, message: "Must be a string", schemaPath: "string" } };
      }
      if (schema.enum && !schema.enum.includes(data)) {
        return { isValid: false, error: { path: this.context.dataPath, message: `Must be one of: ${schema.enum.join(", ")}`, schemaPath: "enum" } };
      }
      return { isValid: true };
    }

    if (schema.type === "number") {
      if (typeof data !== "number" || isNaN(data)) {
        return { isValid: false, error: { path: this.context.dataPath, message: "Must be a number", schemaPath: "number" } };
      }
      return { isValid: true };
    }

    if (schema.type === "boolean") {
      if (typeof data !== "boolean") {
        return { isValid: false, error: { path: this.context.dataPath, message: "Must be a boolean", schemaPath: "boolean" } };
      }
      return { isValid: true };
    }

    return { isValid: true };
  }

  private validateObject(data: unknown, schema: SchemaDefinition): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { isValid: false, errors: [{ path: this.context.dataPath, message: "Expected an object", schemaPath: "object" }] };
    }

    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const key in properties) {
      const propSchema = properties[key];
      const value = (data as Record<string, unknown>)[key];
      const newContext: ValidationContext = { dataPath: `${this.context.dataPath}.${key}` };

      if (required.includes(key) && value === undefined) {
        errors.push({ path: newContext.dataPath, message: "Required field missing", schemaPath: "required" });
        continue;
      }

      if (value !== undefined) {
        const subValidator = new StructuredToolOutputValidator(propSchema, newContext);
        const result = subValidator["validate"](value);
        if (!result.isValid) {
          errors.push(...result.errors);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateArray(data: unknown, schema: SchemaDefinition): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    if (!Array.isArray(data)) {
      return { isValid: false, errors: [{ path: this.context.dataPath, message: "Expected an array", schemaPath: "array" }] };
    }

    const itemSchema = schema.items;
    if (!itemSchema) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < data.length; i++) {
      const itemData = data[i];
      const newContext: ValidationContext = { dataPath: `${this.context.dataPath}[${i}]` };
      const subValidator = new StructuredToolOutputValidator(itemSchema, newContext);
      const result = subValidator["validate"](itemData);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  public validate(data: unknown): { isValid: boolean; errors: ValidationError[] } {
    this.context = { dataPath: "" };
    const result = this.validateSchema(data);
    return result;
  }

  private validateSchema(data: unknown): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    let isValid = true;

    switch (this.schema.type) {
      case "object":
        const objResult = this.validateObject(data, this.schema);
        if (!objResult.isValid) {
          errors.push(...objResult.errors);
          isValid = false;
        }
        break;
      case "array":
        const arrResult = this.validateArray(data, this.schema);
        if (!arrResult.isValid) {
          errors.push(...arrResult.errors);
          isValid = false;
        }
        break;
      case "string":
      case "number":
      case "boolean":
        const primitiveResult = this.validatePrimitive(data, this.schema);
        if (!primitiveResult.isValid) {
          errors.push(primitiveResult.error!);
          isValid = false;
        }
        break;
      case "enum":
        if (typeof data !== "string") {
          errors.push({ path: this.context.dataPath, message: "Enum validation requires a string value", schemaPath: "enum" });
          isValid = false;
        } else if (!this.schema.enum!.includes(data as string)) {
          errors.push({ path: this.context.dataPath, message: `Must be one of: ${this.schema.enum!.join(", ")}`, schemaPath: "enum" });
          isValid = false;
        }
        break;
      default:
        // Unknown type or complex structure not handled by basic switch
        break;
    }

    return { isValid, errors: errors };
  }
}