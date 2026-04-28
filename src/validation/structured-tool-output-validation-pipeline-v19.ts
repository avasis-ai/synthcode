import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationStep {
  validate(data: any, context: any): { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputValidationPipeline {
  private steps: ValidationStep[];

  constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(data: any, context: any): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const step of this.steps) {
      const result = step.validate(data, context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      errors: allErrors,
    };
  }

  static createTypeValidatorStep(schema: Record<string, any>): ValidationStep {
    return {
      validate(data: any, context: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const keys = Object.keys(schema);

        for (const key of keys) {
          const expectedType = schema[key].type;
          const value = data[key];

          if (value === undefined) {
            if (schema[key].required) {
              errors.push(`Missing required field: ${key}`);
            }
            continue;
          }

          const actualType = typeof value;
          if (expectedType === "string" && actualType !== "string") {
            errors.push(`Field ${key} expected type 'string' but got '${actualType}'`);
          } else if (expectedType === "number" && actualType !== "number") {
            errors.push(`Field ${key} expected type 'number' but got '${actualType}'`);
          } else if (expectedType === "boolean" && actualType !== "boolean") {
            errors.push(`Field ${key} expected type 'boolean' but got '${actualType}'`);
          } else if (expectedType === "object" && (actualType !== "object" || Array.isArray(value) || value === null)) {
            errors.push(`Field ${key} expected type 'object' but got '${actualType}'`);
          }
        }

        return { isValid: errors.length === 0, errors };
      },
    };
  }

  static createConstraintValidatorStep(
    validator: (value: any, context: any) => string[]
  ): ValidationStep {
    return {
      validate(data: any, context: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const fieldName = "data"; // Simplified context for demonstration
        
        // In a real scenario, the validator would need more context about which field to check.
        // Here we assume the validator operates on the whole data object or a specific field passed in context.
        const fieldErrors = validator(data, context);
        
        if (fieldErrors.length > 0) {
            errors.push(...fieldErrors);
        }

        return { isValid: errors.length === 0, errors };
      },
    };
  }
}