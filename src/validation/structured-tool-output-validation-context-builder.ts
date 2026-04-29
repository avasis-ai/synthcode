import { Message } from "./message";

interface Validator<T> {
  validate(input: T): { isValid: boolean; errors: string[]; context: Record<string, any> };
}

interface ValidationStep<T> {
  validator: Validator<T>;
  name: string;
}

export class StructuredToolOutputValidationContextBuilder<T> {
  private steps: ValidationStep<T>[] = [];
  private initialContext: Record<string, any>;

  constructor(initialContext: Record<string, any> = {}) {
    this.initialContext = initialContext;
  }

  addSchemaValidator(validator: Validator<T>): this {
    this.steps.push({ validator, name: "Schema" });
    return this;
  }

  addSemanticValidator(validator: Validator<T>): this {
    this.steps.push({ validator, name: "Semantic" });
    return this;
  }

  addConstraintValidator(validator: Validator<T>): this {
    this.steps.push({ validator, name: "Constraint" });
    return this;
  }

  addBusinessLogicValidator(validator: Validator<T>): this {
    this.steps.push({ validator, name: "BusinessLogic" });
    return this;
  }

  build(): {
    steps: ValidationStep<T>[];
    initialContext: Record<string, any>;
    runPipeline: (input: T) => {
      finalContext: Record<string, any> = { ...this.initialContext };
      const results: { stepName: string; isValid: boolean; errors: string[]; context: Record<string, any> }[] = [];

      for (const step of this.steps) {
        const result = step.validator.validate(input);
        results.push({
          stepName: step.name,
          isValid: result.isValid,
          errors: result.errors,
          context: { ...result.context, ...finalContext }
        });
        finalContext = { ...finalContext, ...result.context };
      }

      return {
        finalContext,
        results
      };
    }
  }
}