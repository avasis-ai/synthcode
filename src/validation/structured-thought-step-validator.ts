import {
  AssistantMessage,
  ThinkingBlock,
} from "./types";

export interface ThoughtStep {
  stepType: "plan" | "reflect" | "execute";
  content: Record<string, any>;
}

export interface ValidationSchema {
  [key: string]: {
    required: boolean;
    type: "string" | "number" | "boolean" | "object";
    minLength?: number;
    maxLength?: number;
    customValidator?: (value: any) => boolean;
  };
}

export class StructuredThoughtStepValidator {
  validate(step: ThoughtStep, schema: ValidationSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!step || typeof step.stepType !== "string") {
      return { isValid: false, errors: ["ThoughtStep must be provided and have a stepType."] };
    }

    const stepType = step.stepType;
    const content = step.content;

    if (!content || typeof content !== "object") {
      return { isValid: false, errors: [`Content for ${stepType} is missing or invalid.`] };
    }

    for (const key in schema) {
      if (!Object.prototype.hasOwnProperty.call(schema, key)) continue;

      const rules = schema[key];
      const value = content[key];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push(`Missing required field: ${key}`);
        isValid = false;
        continue;
      }

      if (value === undefined || value === null || value === "") {
        continue;
      }

      // Type validation
      if (rules.type === "string" && typeof value !== "string") {
        errors.push(`Field ${key} expected type 'string', got ${typeof value}.`);
        isValid = false;
      } else if (rules.type === "number" && typeof value !== "number") {
        errors.push(`Field ${key} expected type 'number', got ${typeof value}.`);
        isValid = false;
      } else if (rules.type === "boolean" && typeof value !== "boolean") {
        errors.push(`Field ${key} expected type 'boolean', got ${typeof value}.`);
        isValid = false;
      } else if (rules.type === "object" && (typeof value !== "object" || Array.isArray(value))) {
        errors.push(`Field ${key} expected type 'object', got ${typeof value}.`);
        isValid = false;
      }

      // Length validation (only for strings)
      if (rules.type === "string") {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`Field ${key} must be at least ${rules.minLength} characters long.`);
          isValid = false;
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`Field ${key} must be at most ${rules.maxLength} characters long.`);
          isValid = false;
        }
      }

      // Custom validation
      if (rules.customValidator && !rules.customValidator(value)) {
        errors.push(`Field ${key} failed custom validation.`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }
}