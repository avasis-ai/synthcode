import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ValidationError = {
  path: string;
  message: string;
  constraint?: string;
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CustomValidator {
  (value: any, parentPath: string): string | null;
}

export interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean" | "enum";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  enum?: any[];
  customValidators?: Record<string, CustomValidator>;
  minLength?: number;
  maxLength?: number;
  mustBePositive?: boolean;
}

class StructuredOutputValidator {
  private schema: SchemaDefinition;

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  public validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    this.validateRecursive(data, this.schema, "", errors);

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private validateRecursive(data: any, schema: SchemaDefinition, path: string, errors: ValidationError[]): void {
    if (data === undefined || data === null) {
      if (schema.required && !schema.required.includes(path.split('.').pop()!)) {
        return;
      }
      if (schema.type === "object" && schema.required && !schema.required.includes(path.split('.').pop()!)) {
        return;
      }
    }

    // 1. Type Check
    const actualType = typeof data;
    let expectedType: string | undefined;

    switch (schema.type) {
      case "object":
        expectedType = "object";
        break;
      case "array":
        expectedType = "object"; // Arrays are typeof object in JS
        break;
      case "string":
        expectedType = "string";
        break;
      case "number":
        expectedType = "number";
        break;
      case "boolean":
        expectedType = "boolean";
        break;
      case "enum":
        expectedType = "any"; // Handled separately
        break;
    }

    if (expectedType && actualType !== expectedType && !(schema.type === "array" && Array.isArray(data))) {
      errors.push({ path, message: `Expected type ${schema.type}, but got ${actualType}` });
      return; // Stop deeper validation if type is fundamentally wrong
    }

    // 2. Enum Check
    if (schema.type === "enum" && !schema.enum!.includes(data)) {
      errors.push({ path, message: `Value must be one of: ${schema.enum!.join(', ')}` });
      return;
    }

    // 3. Specific Type Validations
    if (schema.type === "string") {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push({ path, message: `Must be at least ${schema.minLength} characters long`, constraint: "minLength" });
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push({ path, message: `Must be at most ${schema.maxLength} characters long`, constraint: "maxLength" });
      }
    }

    if (schema.type === "number") {
      if (schema.mustBePositive && data <= 0) {
        errors.push({ path, message: "Must be a positive number", constraint: "mustBePositive" });
      }
    }

    // 4. Object Validation
    if (schema.type === "object" && typeof data === "object" && data !== null && !Array.isArray(data)) {
      const properties = schema.properties || {};
      const required = schema.required || [];

      // Check required fields
      for (const key of required) {
        if (!(key in data) || data[key] === undefined || data[key] === null) {
          errors.push({ path: `${path}.${key}`, message: "Required field is missing or null" });
        }
      }

      // Recurse into properties
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const propSchema = properties[key];
          const propPath = path ? `${path}.${key}` : key;
          const propData = data[key];

          if (propData !== undefined && propData !== null) {
            this.validateRecursive(propData, propSchema, propPath, errors);
          } else if (required.includes(key)) {
            // Already caught above, but ensures recursion doesn't run on missing required fields
          }
        }
      }
    }

    // 5. Array Validation
    if (schema.type === "array" && Array.isArray(data)) {
      const itemSchema = schema.items!;
      for (let i = 0; i < data.length; i++) {
        const itemPath = `${path}[${i}]`;
        this.validateRecursive(data[i], itemSchema, itemPath, errors);
      }
    }

    // 6. Custom Validators
    if (schema.customValidators) {
      for (const validatorName in schema.customValidators) {
        const validator = schema.customValidators[validatorName];
        const error = validator(data, path);
        if (error) {
          errors.push({ path, message: error, constraint: validatorName });
        }
      }
    }
  }
}

export { StructuredOutputValidator };