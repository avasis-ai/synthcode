import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ValidatorStep = (data: unknown) => { isValid: boolean; error?: string };

interface ValidationPipeline {
  validate: (data: unknown) => { isValid: boolean; error?: string };
}

class StructuredToolOutputValidationPipelineBuilder {
  private baseSchema: Record<string, any>;
  private steps: ValidatorStep[] = [];
  private failureMode: 'fail_fast' | 'collect_all' = 'fail_fast';
  private errorFormat: 'json' | 'string' = 'string';

  constructor(baseSchema: Record<string, any>) {
    this.baseSchema = baseSchema;
  }

  addTypeValidator(validator: (data: unknown) => { isValid: boolean; error?: string }): this {
    this.steps.push(validator);
    return this;
  }

  addConstraintValidator(validator: (data: unknown) => { isValid: boolean; error?: string }): this {
    this.steps.push(validator);
    return this;
  }

  addSchemaEvolutionValidator(validator: (data: unknown) => { isValid: boolean; error?: string }): this {
    this.steps.push(validator);
    return this;
  }

  setDefaultFailureMode(mode: 'fail_fast' | 'collect_all'): this {
    this.failureMode = mode;
    return this;
  }

  setErrorReportingFormat(format: 'json' | 'string'): this {
    this.errorFormat = format;
    return this;
  }

  build(): ValidationPipeline {
    const validate = (data: unknown): { isValid: boolean; error?: string } => {
      if (typeof data !== 'object' || data === null) {
        return { isValid: false, error: "Input data must be a non-null object." };
      }

      let currentData: unknown = data;
      const results: { isValid: boolean; error?: string }[] = [];

      for (const step of this.steps) {
        const result = step(currentData);
        results.push(result);

        if (!result.isValid) {
          if (this.failureMode === 'fail_fast') {
            return { isValid: false, error: result.error };
          }
          // If collecting all, we continue, but we might update currentData if the step modifies it
          // For simplicity here, we assume steps are read-only or the last valid state is used.
        }
      }

      const overallSuccess = results.every(r => r.isValid);

      if (!overallSuccess) {
        if (this.errorFormat === 'json') {
          return { isValid: false, error: JSON.stringify(results.filter(r => !r.isValid).map(r => r.error)) };
        }
        return { isValid: false, error: `Validation failed at one or more steps. Errors: ${results.filter(r => !r.isValid).map(r => r.error || 'Unknown Error').join('; ')}` };
      }

      return { isValid: true };
    };

    return { validate };
  }
}

export { StructuredToolOutputValidationPipelineBuilder };