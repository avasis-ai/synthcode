import { ToolContext } from "./tool-context";

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface PreconditionValidator {
  validate(context: ToolContext): Promise<ValidationResult>;
}

export class ToolPreconditionValidatorChain {
  private validators: PreconditionValidator[];

  constructor(validators: PreconditionValidator[]) {
    this.validators = validators;
  }

  public async validateAll(context: ToolContext): Promise<ValidationResult> {
    for (const validator of this.validators) {
      const result = await validator.validate(context);
      if (!result.isValid) {
        return {
          isValid: false,
          message: `Precondition failed: ${result.message}`,
        };
      }
    }
    return {
      isValid: true,
      message: "All preconditions passed.",
    };
  }
}