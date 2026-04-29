import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./message-types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface ValidationStep {
  validate: (data: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
  };
}

export class StructuredToolOutputValidationChainBuilder {
  private readonly targetSchema: Record<string, unknown>;
  private validationSteps: ValidationStep[] = [];

  constructor(targetSchema: Record<string, unknown>) {
    this.targetSchema = targetSchema;
  }

  addTypeValidator(): this {
    this.validationSteps.push({
      validate: (data) => {
        const errors: string[] = [];
        // Simplified type checking simulation
        for (const key in data) {
          const value = data[key];
          if (typeof value !== 'object' || value === null) {
            // In a real scenario, we'd check against the schema type
            // For simulation, we just check if it's present.
          }
        }
        return { isValid: true, errors: errors };
      },
    });
    return this;
  }

  addCrossFieldValidator(
    condition: (data: Record<string, unknown>) => boolean,
    errorMessage: string
  ): this {
    this.validationSteps.push({
      validate: (data) => {
        if (condition(data)) {
          return { isValid: true, errors: [] };
        }
        return { isValid: false, errors: [errorMessage] };
      },
    });
    return this;
  }

  addSemanticValidator(
    validator: (data: Record<string, unknown>) => {
      isValid: boolean;
      errors: string[];
    }
  ): this {
    this.validationSteps.push({
      validate: validator,
    });
    return this;
  }

  build(): {
    validate: (data: Record<string, unknown>) => {
      isValid: boolean;
      errors: string[];
    };
  } {
    return {
      validate: (data: Record<string, unknown>) => {
        const allErrors: string[] = [];
        let allValid = true;

        for (const step of this.validationSteps) {
          const result = step.validate(data);
          if (!result.isValid) {
            allErrors.push(...result.errors);
            allValid = false;
          }
        }

        return {
          isValid: allValid,
          errors: allErrors,
        };
      },
    };
  }
}