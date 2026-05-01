import { Context } from "../context";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ConstraintValidator {
  validate(context: Context, payload: any): ValidationResult;
}

export class ContextualConstraintValidatorChain {
  private validators: ConstraintValidator[];

  constructor(validators: ConstraintValidator[] = []) {
    this.validators = validators;
  }

  static create(validators: ConstraintValidator[]): ContextualConstraintValidatorChain {
    return new ContextualConstraintValidatorChain(validators);
  }

  public validateChain(context: Context, payload: any, failFast: boolean = true): ValidationResult {
    let aggregatedErrors: string[] = [];
    let overallValid = true;

    for (const validator of this.validators) {
      const result = validator.validate(context, payload);

      if (!result.isValid) {
        aggregatedErrors.push(...result.errors);
        if (failFast && !result.isValid) {
          return { isValid: false, errors: aggregatedErrors };
        }
      }
    }

    return {
      isValid: overallValid && aggregatedErrors.length === 0,
      errors: aggregatedErrors,
    };
  }
}

export { ContextualConstraintValidatorChain };