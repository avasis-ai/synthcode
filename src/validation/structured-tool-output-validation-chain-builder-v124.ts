import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidatorFunction = (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface ValidationStep {
  execute: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
}

export class StructuredToolOutputValidationChainBuilder {
  private schema: Record<string, unknown>;
  private initialValidators: ValidatorFunction[] = [];
  private sequentialValidators: (() => ValidationStep)[] = [];
  private conditionalValidators: { condition: (output: Record<string, unknown>) => boolean; validator: ValidatorFunction }[] = [];

  constructor(schema: Record<string, unknown>, initialValidators: ValidatorFunction[] = []) {
    this.schema = schema;
    this.initialValidators = initialValidators;
  }

  addSequentialValidator(validator: ValidatorFunction): this {
    return this.addStep(() => ({
      execute: (output) => {
        const result = validator(output);
        return { isValid: result.isValid, errors: result.errors };
      },
    }));
  }

  addConditionalValidator(
    condition: (output: Record<string, unknown>) => boolean,
    validator: ValidatorFunction
  ): this {
    this.conditionalValidators.push({ condition, validator });
    return this;
  }

  private addStep(stepFactory: () => ValidationStep): this {
    this.sequentialValidators.push(stepFactory());
    return this;
  }

  private validateInitial(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const validator of this.initialValidators) {
      const result = validator(output);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }
    return { isValid: allValid, errors: allErrors };
  }

  private validateSequential(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const step of this.sequentialValidators) {
      const result = step.execute(output);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        allValid = false;
      }
    }
    return { isValid: allValid, errors: allErrors };
  }

  private validateConditional(output: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let allValid = true;

    for (const { condition, validator } of this.conditionalValidators) {
      if (condition(output)) {
        const result = validator(output);
        if (!result.isValid) {
          allErrors.push(...result.errors);
          allValid = false;
        }
      }
    }
    return { isValid: allValid, errors: allErrors };
  }

  build(): {
    validate: (output: Record<string, unknown>) => { isValid: boolean; errors: string[] };
    schema: Record<string, unknown>;
  } {
    const validate = (output: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
      let overallErrors: string[] = [];
      let overallValid = true;

      // 1. Initial Validation
      const initialResult = this.validateInitial(output);
      if (!initialResult.isValid) {
        overallErrors.push(...initialResult.errors);
        overallValid = false;
      }

      // 2. Sequential Validation
      const sequentialResult = this.validateSequential(output);
      if (!sequentialResult.isValid) {
        overallErrors.push(...sequentialResult.errors);
        overallValid = false;
      }

      // 3. Conditional Validation
      const conditionalResult = this.validateConditional(output);
      if (!conditionalResult.isValid) {
        overallErrors.push(...conditionalResult.errors);
        overallValid = false;
      }

      return {
        isValid: overallValid,
        errors: [...new Set([...overallErrors])]
      };
    };

    return {
      validate,
      schema: this.schema
    };
  }
}