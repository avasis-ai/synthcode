import { Message, ContentBlock, ToolUseBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

type ValidationContext = {
  input: Record<string, unknown>;
  context: Record<string, any>;
};

export interface ValidationStep {
  execute: (context: ValidationContext) => ValidationResult;
}

class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public validate(context: ValidationContext): ValidationResult {
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.execute(context);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  public static createSchemaValidator(schema: Record<string, any>): ValidationStep {
    return {
      execute: (context: ValidationContext): ValidationResult => {
        const input = context.input;
        const errors: string[] = [];

        for (const key in schema) {
          if (Object.prototype.hasOwnProperty.call(schema, key)) {
            const rules = schema[key];
            const value = input[key];

            if (rules.required && value === undefined) {
              errors.push(`Field '${key}' is required.`);
              continue;
            }

            if (value !== undefined) {
              if (rules.type && typeof value !== rules.type) {
                errors.push(`Field '${key}' expected type ${rules.type}, but got ${typeof value}.`);
              }
              if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                errors.push(`Field '${key}' must be at least ${rules.minLength} characters long.`);
              }
              if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                errors.push(`Field '${key}' must be no more than ${rules.maxLength} characters long.`);
              }
              if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`Field '${key}' must be one of ${rules.enum.join(', ')}.`);
              }
            }
          }
        }

        return {
          isValid: errors.length === 0,
          errors: errors,
        };
      },
    };
  }

  public static createDependencyValidator(
    dependencies: {
      field: string;
      validator: (context: ValidationContext) => string | null;
    }[]
  ): ValidationStep {
    return {
      execute: (context: ValidationContext): ValidationResult => {
        const errors: string[] = [];
        for (const dep of dependencies) {
          const error = dep.validator(context);
          if (error) {
            errors.push(error);
          }
        }
        return {
          isValid: errors.length === 0,
          errors: errors,
        };
      },
    };
  }

  public static createCustomValidator(
    validator: (context: ValidationContext) => string | null
  ): ValidationStep {
    return {
      execute: (context: ValidationContext): ValidationResult => {
        const error = validator(context);
        return {
          isValid: !error,
          errors: error ? [`Custom validation failed: ${error}`] : [],
        };
      },
    };
  }
}

export { StructuredToolInputValidationPipeline };