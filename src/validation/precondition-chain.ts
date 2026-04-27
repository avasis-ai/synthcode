import { EventEmitter } from "node:events";

export interface ToolContext {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  contextUpdates: Partial<ToolContext>;
  error?: string;
}

export interface PreconditionValidator {
  validate(context: ToolContext): Promise<ValidationResult>;
}

export class PreconditionChain {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[]) {
    this.validators = validators;
  }

  public async runChain(initialContext: ToolContext): Promise<{ success: boolean; finalContext: ToolContext; failure?: ValidationResult }> {
    let currentContext: ToolContext = { ...initialContext };
    let lastFailure: ValidationResult | undefined = undefined;

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(currentContext);

        if (!result.isValid) {
          lastFailure = result;
          return { success: false, finalContext: currentContext, failure: lastFailure };
        }

        // Update context with successful results
        currentContext = { ...currentContext, ...result.contextUpdates };
      } catch (error) {
        // Handle unexpected errors during validation
        const errorResult: ValidationResult = {
          isValid: false,
          contextUpdates: {},
          error: `Execution failed unexpectedly: ${(error as Error).message}`,
        };
        lastFailure = errorResult;
        return { success: false, finalContext: currentContext, failure: lastFailure };
      }
    }

    return { success: true, finalContext: currentContext };
  }
}