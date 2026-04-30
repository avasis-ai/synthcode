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

type ValidatorResult = {
  isValid: boolean;
  errors: string[];
};

interface SchemaDefinition {
  type: "object" | "array" | "string" | "number" | "boolean";
  properties?: Record<string, SchemaDefinition>;
  items?: SchemaDefinition;
  required?: string[];
  dependencies?: Record<string, string[]>;
  temporalConstraints?: {
    minTimeSeconds?: number;
    maxTimeSeconds?: number;
  };
}

type CustomValidator = (data: Record<string, unknown>, context: { schema: SchemaDefinition; data: Record<string, unknown> }) => string[] | null;

class StructuredToolOutputSchemaValidatorAdvanced {
  private schema: SchemaDefinition;
  private customValidators: Record<string, CustomValidator> = {};

  constructor(schema: SchemaDefinition) {
    this.schema = schema;
  }

  addCustomValidator(fieldName: string, validator: CustomValidator): void {
    this.customValidators[fieldName] = validator;
  }

  private validateType(data: unknown, expectedType: SchemaDefinition["type"]): ValidatorResult {
    if (typeof data !== "object" || data === null) {
      return { isValid: false, errors: [`Expected type ${expectedType}, but received ${typeof data}`] };
    }

    switch (expectedType) {
      case "object":
        if (Array.isArray(data)) {
          return { isValid: false, errors: "Expected object, but received array." };
        }
        break;
      case "array":
        if (!Array.isArray(data)) {
          return { isValid: false, errors: "Expected array, but received object." };
        }
        break;
      case "string":
        if (typeof data !== "string") {
          return { isValid: false, errors: "Expected string." };
        }
        break;
      case "number":
        if (typeof data !== "number") {
          return { isValid: false, errors: "Expected number." };
        }
        break;
      case "boolean":
        if (typeof data !== "boolean") {
          return { isValid: false, errors: "Expected boolean." };
        }
        break;
    }
    return { isValid: true, errors: [] };
  }

  private validateObject(data: Record<string, unknown>, schema: SchemaDefinition): ValidatorResult {
    const errors: string[] = [];
    const properties = schema.properties || {};

    // 1. Check required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in data) || data[requiredField] === undefined || data[requiredField] === null) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    // 2. Check properties and types
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const propSchema = properties[key];
        const value = data[key];

        if (value === undefined || value === null) continue;

        const typeValidation = this.validateType(value, propSchema.type);
        if (!typeValidation.isValid) {
          errors.push(`Field '${key}': ${typeValidation.errors.join(', ')}`);
        } else {
          if (propSchema.type === "object" && propSchema.properties) {
            const nestedResult = this.validateObject(value as Record<string, unknown>, propSchema as SchemaDefinition);
            errors.push(...nestedResult.errors.map(err => `Field '${key}': ${err}`));
          } else if (propSchema.type === "array" && propSchema.items) {
            const arrayResult = this.validateArray(value as unknown, propSchema.items);
            errors.push(...arrayResult.errors.map(err => `Field '${key}': ${err}`));
          }
        }
      }
    }

    // 3. Check cross-field dependencies
    if (schema.dependencies) {
      for (const dependencyField in schema.dependencies) {
        const requiredFields = schema.dependencies[dependencyField];
        if (requiredFields.length > 0) {
          const value = data[dependencyField];
          if (value !== undefined && value !== null) {
            for (const requiredField of requiredFields) {
              if (!(requiredField in data) || data[requiredField] === undefined || data[requiredField] === null) {
                errors.push(`Dependency violation: Field '${dependencyField}' requires '${requiredField}' to be present.`);
              }
            }
          }
        }
      }
    }

    // 4. Check custom validators
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key) && this.customValidators[key]) {
        const validator = this.customValidators[key];
        const customErrors = validator(data[key] as Record<string, unknown>, { schema: schema, data: data });
        if (customErrors) {
          errors.push(...customErrors);
        }
      }
    }

    // 5. Check temporal constraints (assuming the data object contains a 'timestamp' field)
    if (schema.temporalConstraints) {
      const timestamp = data['timestamp'] as number;
      if (timestamp !== undefined) {
        if (schema.temporalConstraints.minTimeSeconds !== undefined && timestamp < schema.temporalConstraints.minTimeSeconds) {
          errors.push(`Temporal constraint violation: Timestamp ${timestamp} is before minimum allowed time ${schema.temporalConstraints.minTimeSeconds}.`);
        }
        if (schema.temporalConstraints.maxTimeSeconds !== undefined && timestamp > schema.temporalConstraints.maxTimeSeconds) {
          errors.push(`Temporal constraint violation: Timestamp ${timestamp} is after maximum allowed time ${schema.temporalConstraints.maxTimeSeconds}.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateArray(data: unknown, itemSchema: SchemaDefinition): ValidatorResult {
    if (!Array.isArray(data)) {
      return { isValid: false, errors: "Expected an array." };
    }

    const errors: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (itemSchema.type === "object" && itemSchema.properties) {
        const itemResult = this.validateObject(item as Record<string, unknown>, itemSchema as SchemaDefinition);
        if (!itemResult.isValid) {
          errors.push(`Item at index ${i} failed validation: ${itemResult.errors.join('; ')}`);
        }
      } else {
        // Simple type check for array items
        const simpleResult = this.validateType(item, itemSchema.type);
        if (!simpleResult.isValid) {
          errors.push(`Item at index ${i} failed validation: ${simpleResult.errors.join('; ')}`);
        }
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  public validate(data: Record<string, unknown>): ValidatorResult {
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { isValid: false, errors: ["Input data must be a non-array object."] };
    }
    return this.validateObject(data, this.schema);
  }
}

export { StructuredToolOutputSchemaValidatorAdvanced };