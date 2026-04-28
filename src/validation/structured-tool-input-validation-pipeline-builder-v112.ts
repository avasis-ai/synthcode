import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidationStep = (input: Record<string, unknown>) => { isValid: boolean; errors: string[] };

interface CrossFieldValidator {
  (input: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

interface TemporalValidator {
  (input: Record<string, unknown>): { isValid: boolean; errors: string[] };
}

export class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private crossFieldValidators: CrossFieldValidator[] = [];
  private temporalValidators: TemporalValidator[] = [];

  addBasicValidator(validator: (input: Record<string, unknown>) => { isValid: boolean; errors: string[] }): this {
    this.steps.push(validator);
    return this;
  }

  addCrossFieldValidator(validator: CrossFieldValidator): this {
    this.crossFieldValidators.push(validator);
    return this;
  }

  addTemporalValidator(validator: TemporalValidator): this {
    this.temporalValidators.push(validator);
    return this;
  }

  private validateBasic(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    for (const step of this.steps) {
      const result = step(input);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    return { isValid: allErrors.length === 0, errors: allErrors };
  }

  private validateCrossField(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    for (const validator of this.crossFieldValidators) {
      const result = validator(input);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    return { isValid: allErrors.length === 0, errors: allErrors };
  }

  private validateTemporal(input: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    for (const validator of this.temporalValidators) {
      const result = validator(input);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    return { isValid: allErrors.length === 0, errors: allErrors };
  }

  build(): (input: Record<string, unknown>) => { isValid: boolean; errors: string[] } {
    return (input: Record<string, unknown>): { isValid: boolean; errors: string[] } => {
      const basicResult = this.validateBasic(input);
      if (!basicResult.isValid) {
        return { isValid: false, errors: basicResult.errors };
      }

      const crossFieldResult = this.validateCrossField(input);
      if (!crossFieldResult.isValid) {
        return { isValid: false, errors: crossFieldResult.errors };
      }

      const temporalResult = this.validateTemporal(input);
      if (!temporalResult.isValid) {
        return { isValid: false, errors: temporalResult.errors };
      }

      return { isValid: true, errors: [] };
    };
  }
}