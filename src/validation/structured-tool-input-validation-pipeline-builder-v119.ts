import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationStep = (input: Record<string, unknown>) => { isValid: boolean; errors: string[]; };

interface ValidationPipeline {
  validate: (input: Record<string, unknown>) => { isValid: boolean; errors: string[]; };
}

class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];
  private initialSchema: Record<string, unknown> | null = null;

  constructor() {}

  public withInitialSchema(schema: Record<string, unknown>): this {
    this.initialSchema = schema;
    return this;
  }

  private addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public addRequiredFieldStep(fieldName: string): this {
    return this.addStep((input) => {
      if (!(fieldName in input) || input[fieldName] === null || input[fieldName] === undefined) {
        return { isValid: false, errors: [`Required field '${fieldName}' is missing or null.`] };
      }
      return { isValid: true, errors: [] };
    });
  }

  public addTypeConstraintStep<T>(fieldName: string, validator: (value: unknown) => { isValid: boolean; message: string }): this {
    return this.addStep((input) => {
      const value = input[fieldName];
      if (value === undefined || value === null) {
        return { isValid: true, errors: [] }; // Assume optional if not present for this step
      }
      const result = validator(value);
      if (!result.isValid) {
        return { isValid: false, errors: [result.message] };
      }
      return { isValid: true, errors: [] };
    });
  }

  public addCrossFieldDependencyStep(
    dependentField: string,
    dependencyField: string,
    condition: (value1: unknown, value2: unknown) => boolean,
    errorMessage: string
  ): this {
    return this.addStep((input) => {
      const value1 = input[dependentField];
      const value2 = input[dependencyField];

      if (value1 === undefined || value2 === undefined) {
        return { isValid: true, errors: [] }; // Cannot validate dependency if fields are missing
      }

      if (!condition(value1, value2)) {
        return { isValid: false, errors: [errorMessage] };
      }
      return { isValid: true, errors: [] };
    });
  }

  public addTemporalConstraintStep(
    fieldName: string,
    minTimeSeconds: number,
    maxTimeSeconds: number
  ): this {
    return this.addStep((input) => {
      const value = input[fieldName];
      if (typeof value !== 'number') {
        return { isValid: true, errors: [] };
      }
      const timeDiff = Math.abs(value); // Assuming value is a timestamp or time difference
      if (timeDiff < minTimeSeconds || timeDiff > maxTimeSeconds) {
        return { isValid: false, errors: [`Time constraint violation: must be between ${minTimeSeconds} and ${maxTimeSeconds} seconds.`] };
      }
      return { isValid: true, errors: [] };
    });
  }

  public build(): ValidationPipeline {
    const validate = (input: Record<string, unknown>): { isValid: boolean; errors: string[]; } => {
      let allErrors: string[] = [];
      let overallValid = true;

      for (const step of this.steps) {
        const result = step(input);
        if (!result.isValid) {
          allErrors = allErrors.concat(result.errors);
          overallValid = false;
        }
      }

      return {
        isValid: overallValid,
        errors: allErrors,
      };
    };

    return { validate };
  }
}

export { StructuredToolInputValidationPipelineBuilder };