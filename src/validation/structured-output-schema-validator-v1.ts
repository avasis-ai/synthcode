import {
  Schema,
  ValidationResult,
} from "./types";

export class StructuredOutputSchemaValidatorV1 {
  private schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  public validate(data: any): ValidationResult {
    const errors: string[] = [];
    this.validateRecursive(data, this.schema, "", errors);

    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors,
      };
    }
    return {
      isValid: true,
      errors: [],
    };
  }

  private validateRecursive(
    data: any,
    schema: Schema,
    path: string,
    errors: string[]
  ): void {
    if (!schema) {
      return;
    }

    // 1. Type Check
    const expectedType = schema.type;
    const actualType = typeof data;

    if (expectedType && expectedType !== "any" && actualType !== expectedType) {
      // Handle array type check separately
      if (expectedType === "array" && !Array.isArray(data)) {
        errors.push(`${path}: Expected type 'array', but got ${actualType}.`);
      } else if (expectedType !== "array" && !isNaN(Number(data)) && expectedType === "number") {
        // Allow number type check if data is a valid number string (though JSON usually handles this)
      } else if (expectedType !== "array" && actualType !== expectedType) {
        errors.push(`${path}: Expected type '${expectedType}', but got '${actualType}'.`);
      }
    }

    // 2. Object Validation (Properties)
    if (expectedType === "object" && data !== null && typeof data === "object" && !Array.isArray(data)) {
      const properties = schema.properties || {} as Record<string, Schema>;

      // Check required fields
      if (schema.required && Array.isArray(schema.required)) {
        for (const requiredProp of schema.required) {
          if (!(requiredProp in data)) {
            errors.push(`${path}: Required property '${requiredProp}' is missing.`);
          }
        }
      }

      // Validate defined properties
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const propSchema = properties[key];
          const value = data[key];
          const newPath = path ? `${path}.${key}` : key;

          if (value !== undefined) {
            this.validateRecursive(value, propSchema, newPath, errors);
          } else if (propSchema.required) {
            // This case is mostly covered by the required check above, but good for safety
          }
        }
      }
    }

    // 3. Array Validation (Items)
    if (expectedType === "array" && Array.isArray(data)) {
      const itemSchema = schema.items;
      if (itemSchema) {
        for (let i = 0; i < data.length; i++) {
          const itemPath = `${path}[${i}]`;
          this.validateRecursive(data[i], itemSchema, itemPath, errors);
        }
      }
    }

    // 4. Custom Schema Logic (e.g., enums, pattern matching - simplified)
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`${path}: Value must be one of the allowed enumerations: ${schema.enum.join(', ')}.`);
    }
  }
}