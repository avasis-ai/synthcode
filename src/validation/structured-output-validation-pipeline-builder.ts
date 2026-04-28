import { Message } from "./message";

type ValidationStep<T> = (data: T) => { isValid: boolean; errors: string[] };

interface Validator<T> {
  validate: (data: T) => { isValid: boolean; errors: string[] };
}

export class StructuredOutputValidationPipelineBuilder<T> {
  private readonly initialSchema: T;
  private validationSteps: { step: (data: T) => { isValid: boolean; errors: string[] }; name: string }[] = [];

  constructor(schema: T) {
    this.initialSchema = schema;
  }

  public addTypeCheck(name: string, validator: (data: T) => { isValid: boolean; errors: string[] }): this {
    this.validationSteps.push({ step: validator, name });
    return this;
  }

  public addCrossFieldCheck(name: string, validator: (data: T) => { isValid: boolean; errors: string[] }): this {
    this.validationSteps.push({ step: validator, name });
    return this;
  }

  public addTemporalCheck(name: string, validator: (data: T) => { isValid: boolean; errors: string[] }): this {
    this.validationSteps.push({ step: validator, name });
    return this;
  }

  public build(): {
    validate: (data: T) => { isValid: boolean; errors: string[]; allPassed: boolean };
    getSchema: () => T;
  } {
    const validatePipeline = (data: T): { isValid: boolean; errors: string[]; allPassed: boolean } => {
      const allErrors: string[] = [];
      let allPassed = true;

      for (const { step, name } of this.validationSteps) {
        const result = step(data);
        if (!result.isValid) {
          allErrors.push(`[${name}] Validation failed: ${result.errors.join('; ')}`);
          allPassed = false;
        }
      }

      return {
        isValid: allPassed,
        errors: allErrors,
        allPassed: allPassed,
      };
    };

    return {
      validate: validatePipeline,
      getSchema: () => this.initialSchema,
    };
  }
}