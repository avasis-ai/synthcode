import { Message } from "./message";

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface ToolOutputValidator {
  (output: unknown): ValidationResult | unknown;
}

export class ToolOutputValidationChainExecutor {
  private readonly validators: ToolOutputValidator[];

  constructor(validators: ToolOutputValidator[]) {
    this.validators = validators;
  }

  public execute(initialOutput: unknown): ValidationResult {
    let currentOutput: unknown = initialOutput;

    for (const validator of this.validators) {
      try {
        const result = validator(currentOutput);

        if (typeof result === 'object' && result !== null && 'isValid' in result && 'message' in result) {
          const validationResult = result as ValidationResult;
          if (!validationResult.isValid) {
            return { isValid: false, message: `Validation failed at ${validator.constructor.name}: ${validationResult.message}` };
          }
          // If validation passes, we might update the output for the next validator
          // For simplicity, we assume the validator returns the refined output if successful,
          // or we pass the original output if the validator only checks.
          // Following the prompt's spirit of progressive refinement, we'll assume
          // a successful validation might refine the output structure, but for now,
          // we'll just pass the original output unless the validator explicitly returns a new structure.
          // Since the interface only guarantees ValidationResult or throws, we stick to the original output
          // unless the validator is designed to return the refined output type.
          // Given the ambiguity, we'll treat the output as immutable for subsequent checks unless the validator throws.
          currentOutput = initialOutput; // Revert to initial for safety if refinement isn't specified
        } else if (typeof result === 'object' && result !== null && 'isValid' in result && 'message' in result) {
            // This case handles if the validator returns the ValidationResult object directly
            const validationResult = result as ValidationResult;
            if (!validationResult.isValid) {
                return { isValid: false, message: `Validation failed at ${validator.constructor.name}: ${validationResult.message}` };
            }
            currentOutput = initialOutput;
        } else {
          // If the validator returns something else (e.g., the refined output structure itself)
          // We assume the validator is designed to return the next state if successful.
          currentOutput = result;
        }
      } catch (error) {
        return { isValid: false, message: `Validation failed at ${validator.constructor.name} due to error: ${(error as Error).message}` };
      }
    }

    return { isValid: true, message: "All validations passed." };
  }
}