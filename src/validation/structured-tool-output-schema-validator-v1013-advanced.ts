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

type SchemaDefinition = Record<string, any>;

type ConditionalRule = {
  if: {
    field: string;
    operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
    value: unknown;
  };
  then: {
    field: string;
    required?: boolean;
    type?: "string" | "number" | "boolean" | "object" | "array";
  };
};

type AdvancedSchema = {
  type: "object";
  properties: Record<string, any>;
  required: string[];
  conditional?: ConditionalRule[];
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class StructuredToolOutputSchemaValidatorAdvanced {
  private schema: AdvancedSchema;

  constructor(schema: AdvancedSchema) {
    this.schema = schema;
  }

  private validateBasicType(data: unknown, expectedType: "string" | "number" | "boolean" | "object" | "array"): boolean {
    if (typeof data === "undefined" || data === null) {
      return false;
    }
    switch (expectedType) {
      case "string":
        return typeof data === "string";
      case "number":
        return typeof data === "number";
      case "boolean":
        return typeof data === "boolean";
      case "object":
        return typeof data === "object" && !Array.isArray(data);
      case "array":
        return Array.isArray(data);
      default:
        return false;
    }
  }

  private validateCrossFieldConstraints(data: Record<string, unknown>, rules: ConditionalRule[]): string[] {
    const errors: string[] = [];
    for (const rule of rules) {
      const { field: conditionField, operator, value } = rule.if;
      const conditionValue = data[conditionField];

      if (conditionValue === undefined) continue;

      let conditionMet = false;
      switch (operator) {
        case "==":
          conditionMet = conditionValue == value;
          break;
        case "!=":
          conditionMet = conditionValue != value;
          break;
        case ">":
          if (typeof conditionValue === 'number' && typeof value === 'number') {
            conditionMet = (conditionValue > value);
          }
          break;
        case "<":
          if (typeof conditionValue === 'number' && typeof value === 'number') {
            conditionMet = (conditionValue < value);
          }
          break;
        case ">=":
          if (typeof conditionValue === 'number' && typeof value === 'number') {
            conditionMet = (conditionValue >= value);
          }
          break;
        case "<=":
          if (typeof conditionValue === 'number' && typeof value === 'number') {
            conditionMet = (conditionValue <= value);
          }
          break;
      }

      if (conditionMet) {
        const { field: requiredField, required: isRequired, type: expectedType } = rule.then;
        if (isRequired && (data[requiredField] === undefined || data[requiredField] === null)) {
          errors.push(`Conditional failure: Field '${requiredField}' must be present because '${conditionField}' ${operator} ${value}.`);
        } else if (expectedType && data[requiredField] !== undefined && data[requiredField] !== null) {
          if (expectedType !== "object" && expectedType !== "array") {
            const actualType = typeof data[requiredField];
            if (actualType !== expectedType) {
              errors.push(`Conditional failure: Field '${requiredField}' must be of type '${expectedType}', but got '${actualType}'.`);
            }
          }
        }
      }
    }
    return errors;
  }

  public validate(data: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    // 1. Check required fields and basic types
    for (const propName of this.schema.required) {
      if (data[propName] === undefined || data[propName] === null) {
        errors.push(`Missing required field: '${propName}'.`);
      }
    }

    // 2. Check properties and advanced constraints
    for (const [propName, propSchema] of Object.entries(this.schema.properties)) {
      if (propName === "conditional") continue;

      const value = data[propName];

      if (value === undefined || value === null) continue;

      // Basic Type Check (Simplified for demonstration)
      if (propSchema.type) {
        const expectedType = propSchema.type as "string" | "number" | "boolean" | "object" | "array";
        if (!this.validateBasicType(value, expectedType)) {
          errors.push(`Field '${propName}' has incorrect type. Expected '${expectedType}'.`);
        }
      }

      // Cross-Field/Conditional Check
      if (propSchema.conditional && Array.isArray(propSchema.conditional)) {
        const conditionalErrors = this.validateCrossFieldConstraints(data, propSchema.conditional);
        errors.push(...conditionalErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export { StructuredToolOutputSchemaValidatorAdvanced };