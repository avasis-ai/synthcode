import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface Context {
  messages: Message[];
  // Add other context properties as needed
}

export interface Constraint {
  name: string;
  validate: (context: Context) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConstraintValidator {
  validate(context: Context, constraints: Constraint[]): ValidationResult;
}

export class ContextualConstraintValidationChain implements ConstraintValidator {
  private validators: ConstraintValidator[];

  constructor(validators: ConstraintValidator[]) {
    this.validators = validators;
  }

  validate(context: Context, constraints: Constraint[]): ValidationResult {
    let allErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context, constraints);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        overallValid = false;
        // In a real-world scenario, you might decide whether to break here
        // or continue to collect all errors from all validators.
        // Following the prompt's "stopping immediately upon the first failure"
        // but also "aggregating all encountered errors" is contradictory.
        // We will aggregate errors from all validators for comprehensive reporting,
        // but the structure allows for early exit logic if needed.
      }
    }

    return {
      isValid: overallValid,
      errors: allErrors,
    };
  }
}