import { ValidatorContext, ValidationResult } from "./validation-context";

export type CrossFieldValidator<T> = (
  input: T,
  context: {
  data: Record<string, unknown>;
  message: string;
}
) => ValidationResult;

export interface AdvancedValidationRule<T> {
  validate: (
    input: T,
    context: {
      data: Record<string, unknown>;
      message: string;
    }
  ) => ValidationResult;
}

export class StructuredToolInputSchemaValidatorV1005 {
  private rules: AdvancedValidationRule<any>[] = [];

  public addRule(rule: AdvancedValidationRule<any>): this {
    this.rules.push(rule);
    return this;
  }

  public validate<T>(
    input: T,
    context: {
      data: Record<string, unknown>;
      message: string;
    }
  ): ValidationResult {
    for (const rule of this.rules) {
      const result = rule.validate(input, context);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true, message: "Validation successful." };
  }
}

export const createStructuredToolInputSchemaValidator = (): StructuredToolInputSchemaValidatorV1005 => {
  return new StructuredToolInputSchemaValidatorV1005();
};