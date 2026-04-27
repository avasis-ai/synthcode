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

export interface SchemaConstraint {
  required?: boolean;
  type: "string" | "number" | "object" | "array";
  minLength?: number;
  maxLength?: number;
  schema?: Record<string, SchemaConstraint>;
}

export interface StatefulToolOutputSchemaValidator {
  validate(input: any, currentState: any): {
    isValid: boolean;
    newState: any;
    error?: string;
  };
}

export class SchemaValidatorImpl implements StatefulToolOutputSchemaValidator {
  private readonly targetSchema: SchemaConstraint;

  constructor(targetSchema: SchemaConstraint) {
    this.targetSchema = targetSchema;
  }

  private validateValue(value: any, constraint: SchemaConstraint): {
    isValid: boolean;
    error?: string;
  }: { isValid: boolean; error?: string } {
    if (constraint.required && (value === null || value === undefined || value === "")) {
      return { isValid: false, error: "Field is required." };
    }
    if (value === null || value === undefined || (typeof value === "string" && value === "")) {
      return { isValid: true };
    }

    switch (constraint.type) {
      case "string":
        if (typeof value !== "string") {
          return { isValid: false, error: `Expected string, got ${typeof value}.` };
        }
        if (constraint.minLength !== undefined && value.length < constraint.minLength) {
          return { isValid: false, error: `Must be at least ${constraint.minLength} characters long.` };
        }
        if (constraint.maxLength !== undefined && value.length > constraint.maxLength) {
          return { isValid: false, error: `Must be at most ${constraint.maxLength} characters long.` };
        }
        return { isValid: true };

      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          return { isValid: false, error: "Expected a valid number." };
        }
        return { isValid: true };

      case "object":
        if (typeof value !== "object" || Array.isArray(value) || value === null) {
          return { isValid: false, error: "Expected a non-null object." };
        }
        if (constraint.schema) {
          const result = this.validateObject(value, constraint.schema);
          return result;
        }
        return { isValid: true };

      case "array":
        if (!Array.isArray(value)) {
          return { isValid: false, error: "Expected an array." };
        }
        // Simple array validation: assume all elements must conform to a basic type if schema is provided
        if (constraint.schema && constraint.schema.items) {
            const itemConstraint = constraint.schema.items;
            for (let i = 0; i < value.length; i++) {
                const itemResult = this.validateValue(value[i], itemConstraint);
                if (!itemResult.isValid) {
                    return { isValid: false, error: `Array item at index ${i} failed validation: ${itemResult.error}` };
                }
            }
        }
        return { isValid: true };

      default:
        return { isValid: false, error: `Unknown type specified: ${constraint.type}` };
    }
  }

  private validateObject(data: Record<string, unknown>, schema: Record<string, SchemaConstraint>): {
    isValid: boolean;
    error?: string;
  } {
    for (const key in schema) {
      const constraint = schema[key];
      const value = data[key];

      const validationResult = this.validateValue(value, constraint);

      if (!validationResult.isValid) {
        return { isValid: false, error: `Validation failed for key '${key}': ${validationResult.error}` };
      }
    }
    return { isValid: true };
  }

  validate(input: any, currentState: any): {
    isValid: boolean;
    newState: any;
    error?: string;
  } {
    // 1. Validate the current input against the schema
    const validationResult = this.validateObject(input, this.targetSchema);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        newState: currentState,
        error: `Input validation failed: ${validationResult.error}`,
      };
    }

    // 2. If valid, merge/update the state (simplistic merge for this example)
    // In a real scenario, state update logic would be complex, potentially merging based on schema structure.
    const newState: any = {
      ...currentState,
      ...input,
      lastValidatedInput: input,
    };

    return {
      isValid: true,
      newState: newState,
    };
  }
}

export const createSchemaValidator = (targetSchema: SchemaConstraint): StatefulToolOutputSchemaValidator => {
  return new SchemaValidatorImpl(targetSchema);
};