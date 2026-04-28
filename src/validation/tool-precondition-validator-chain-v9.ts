import { ToolContext, ValidationResult } from "./types";

export interface AdvancedPreconditionValidator {
  validate(context: ToolContext): ValidationResult;
}

export class ToolPreconditionValidatorChainV9 {
  private validators: AdvancedPreconditionValidator[];

  constructor(validators: AdvancedPreconditionValidator[] = []) {
    this.validators = validators;
  }

  addValidator(validator: AdvancedPreconditionValidator): this {
    this.validators.push(validator);
    return this;
  }

  async validate(context: ToolContext): Promise<ValidationResult> {
    let finalResult: ValidationResult = {
      isValid: true,
      errors: [] as string[],
      remediationSteps: [] as string[],
    };

    for (const validator of this.validators) {
      const result = validator.validate(context);
      if (!result.isValid) {
        finalResult.isValid = false;
        finalResult.errors.push(...result.errors);
        finalResult.remediationSteps.push(...result.remediationSteps);
      }
    }

    return finalResult;
  }
}