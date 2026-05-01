import { Message, ToolResultMessage } from "./types";

interface ValidationContext {
  output: Record<string, unknown>;
  message: Message;
}

interface ValidationStep {
  validate: (context: ValidationContext) => { isValid: boolean; errors: string[] };
}

interface CrossFieldValidator {
  validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

class StructuredToolOutputValidationChainBuilder {
  private steps: ValidationStep[] = [];
  private crossFieldChecks: CrossFieldValidator[] = [];

  addStep(validator: (context: ValidationContext) => { isValid: boolean; errors: string[] }): this {
    this.steps.push({
      validate: (context) => validator(context),
    });
    return this;
  }

  addCrossFieldCheck(validator: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] }): this {
    this.crossFieldChecks.push({
      validate: (output) => validator(output),
    });
    return this;
  }

  build(): {
    validateChain: (context: ValidationContext) => { isValid: boolean; errors: string[] };
    validateCrossFields: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
  } {
    const validateChain = (context: ValidationContext): { isValid: boolean; errors: string[] } => {
      let allErrors: string[] = [];
      let allValid = true;

      for (const step of this.steps) {
        const result = step.validate(context);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          allValid = false;
        }
      }
      return { isValid: allValid, errors: allErrors };
    };

    const validateCrossFields = (output: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
      let allErrors: string[] = [];
      let allValid = true;

      for (const check of this.crossFieldChecks) {
        const result = check.validate(output);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          allValid = false;
        }
      }
      return { isValid: allValid, errors: allErrors };
    };

    return {
      validateChain,
      validateCrossFields,
    };
  }
}

export { StructuredToolOutputValidationChainBuilder };