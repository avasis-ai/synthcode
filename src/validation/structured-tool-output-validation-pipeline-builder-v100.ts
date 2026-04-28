import { Message } from "./types";

type ValidatorFunction<T> = (data: T) => { isValid: boolean; errors: string[] };

interface ValidationStep<T> {
  validator: ValidatorFunction<T>;
  name: string;
}

export class StructuredToolOutputValidationPipelineBuilder {
  private schema: Record<string, any>;
  private steps: ValidationStep<any>[] = [];

  constructor(schema: Record<string, any>) {
    this.schema = schema;
  }

  addTypeValidator(step: ValidationStep<any>): this {
    this.steps.push(step);
    return this;
  }

  addCrossFieldValidator(step: ValidationStep<any>): this {
    this.steps.push(step);
    return this;
  }

  addTemporalValidator(step: ValidationStep<any>): this {
    this.steps.push(step);
    return this;
  }

  build(): {
    validate: <T>(data: T) => { isValid: boolean; errors: string[] };
  } {
    const validate = <T>(data: T): { isValid: boolean; errors: string[] } => {
      let allErrors: string[] = [];
      let isValid = true;

      for (const step of this.steps) {
        const result = step.validator(data);
        if (!result.isValid) {
          isValid = false;
          allErrors.push(...result.errors);
        }
      }

      return { isValid, errors: allErrors };
    };

    return { validate };
  }
}