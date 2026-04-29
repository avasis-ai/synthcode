import { ValidatorBase } from "./validator-base";

export type SchemaDefinition = Record<string, SchemaItem>;

export interface SchemaItem {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: Record<string, SchemaItem>;
  items?: SchemaDefinition;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  enum?: string[];
}

export interface ToolOutputSchema {
  [key: string]: unknown;
}

export class StructuredToolOutputSchemaValidatorV1018 extends ValidatorBase {
  private schema: SchemaDefinition;

  constructor(schema: SchemaDefinition) {
    super();
    this.schema = schema;
  }

  validate(data: unknown): { isValid: boolean; errors: string[] } {
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ["Input data must be a non-null object."] };
    }

    const errors: string[] = [];
    this.validateObject(data, this.schema, "", errors);

    return { isValid: errors.length === 0, errors };
  }

  private validateObject(data: unknown, schema: SchemaDefinition, path: string, errors: string[]): void {
    if (typeof data !== 'object' || data === null) {
      errors.push(`Path "${path}": Expected object, got ${typeof data}.`);
      return;
    }

    const actualObject = data as Record<string, unknown>;
    const requiredFields = schema.required || [];

    // Check for required fields
    for (const field of requiredFields) {
      if (!(field in actualObject)) {
        errors.push(`Path "${path}": Missing required field "${field}".`);
      }
    }

    // Validate properties
    const properties = schema.properties;
    if (properties) {
      for (const key in properties) {
        const propertySchema = properties[key];
        const fullPath = path ? `${path}.${key}` : key;
        const value = actualObject[key];

        if (value === undefined) continue;

        if (propertySchema.type === "object") {
          this.validateObject(value, propertySchema as SchemaDefinition, fullPath, errors);
        } else if (propertySchema.type === "array") {
          this.validateArray(value, propertySchema as SchemaDefinition, fullPath, errors);
        } else if (propertySchema.type === "string") {
          this.validateString(value, propertySchema, fullPath, errors);
        } else if (propertySchema.type === "number") {
          this.validateNumber(value, propertySchema, fullPath, errors);
        } else if (propertySchema.type === "boolean") {
          if (typeof value !== 'boolean') {
            errors.push(`Path "${fullPath}": Expected boolean, got ${typeof value}.`);
          }
        }
      }
    }
  }

  private validateArray(data: unknown, schema: SchemaDefinition, path: string, errors: string[]): void {
    if (!Array.isArray(data)) {
      errors.push(`Path "${path}": Expected array, got ${typeof data}.`);
      return;
    }

    const itemSchema = schema.items;
    if (!itemSchema) {
      errors.push(`Path "${path}": Array schema missing 'items' definition.`);
      return;
    }

    for (let i = 0; i < data.length; i++) {
      const itemPath = `${path}[${i}]`;
      const itemValue = data[i];

      if (itemSchema.type === "object") {
        this.validateObject(itemValue, itemSchema as SchemaDefinition, itemPath, errors);
      } else if (itemSchema.type === "array") {
        this.validateArray(itemValue, itemSchema as SchemaDefinition, itemPath, errors);
      } else if (itemSchema.type === "string") {
        this.validateString(itemValue, itemSchema, itemPath, errors);
      } else if (itemSchema.type === "number") {
        this.validateNumber(itemValue, itemSchema, itemPath, errors);
      }
    }
  }

  private validateString(data: unknown, schema: SchemaItem, path: string, errors: string[]): void {
    if (typeof data !== 'string') {
      errors.push(`Path "${path}": Expected string, got ${typeof data}.`);
      return;
    }

    const str = data as string;
    if (schema.minLength !== undefined && str.length < schema.minLength) {
      errors.push(`Path "${path}": String length must be at least ${schema.minLength}.`);
    }
    if (schema.maxLength !== undefined && str.length > schema.maxLength) {
      errors.push(`Path "${path}": String length must be at most ${schema.maxLength}.`);
    }
    if (schema.enum && !schema.enum.includes(str)) {
      errors.push(`Path "${path}": String must be one of enum values: ${schema.enum.join(', ')}.`);
    }
  }

  private validateNumber(data: unknown, schema: SchemaItem, path: string, errors: string[]): void {
    if (typeof data !== 'number' || isNaN(data)) {
      errors.push(`Path "${path}": Expected number, got ${typeof data}.`);
      return;
    }
    // Basic number validation (e.g., range checks could be added here)
  }

  private checkCrossFieldConstraints(data: unknown, schema: SchemaDefinition, path: string, errors: string[]): void {
    // Placeholder for complex cross-field validation logic (e.g., if field A is present, field B must be > 10)
    // This method would be called after basic structural validation passes.
  }

  public validateWithCrossChecks(data: unknown): { isValid: boolean; errors: string[] } {
    const structuralErrors = this.validate(data);
    if (!structuralErrors.isValid) {
      return { isValid: false, errors: structuralErrors.errors };
    }

    const crossFieldErrors: string[] = [];
    this.checkCrossFieldConstraints(data, this.schema, "", crossFieldErrors);

    const allErrors = [...structuralErrors.errors, ...crossFieldErrors];
    return { isValid: allErrors.length === 0, errors: allErrors };
  }
}