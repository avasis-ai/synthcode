import { SchemaValidator } from "./schema-validator";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export class ToolInputSchemaPipeline {
  private readonly validator: SchemaValidator;

  constructor(validator: SchemaValidator) {
    this.validator = validator;
  }

  public validate(input: any): ValidationResult {
    return this.validator.validate(input);
  }

  public run(input: any): ValidationResult {
    return this.validate(input);
  }
}