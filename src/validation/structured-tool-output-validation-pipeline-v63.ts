import { Message, ToolResultMessage } from "./types";

export interface ValidationContext {
  input: unknown;
  state: Record<string, unknown>;
  history: Message[];
}

export interface ValidationStep {
  execute(context: ValidationContext): Promise<{ isValid: boolean; context: ValidationContext; error?: string }>;
}

export interface CrossFieldValidator {
  validate(data: Record<string, unknown>, context: ValidationContext): { isValid: boolean; error?: string };
}

export interface TemporalValidator {
  validate(data: Record<string, unknown>, context: ValidationContext): { isValid: boolean; error?: string };
}

export interface StructuredToolOutputValidator {
  validate(output: ToolResultMessage): Promise<{ isValid: boolean; errors: string[] }>;
}

export class ValidationPipeline {
  private steps: ValidationStep[];
  private crossFieldValidators: CrossFieldValidator[];
  private temporalValidators: TemporalValidator[];

  constructor(steps: ValidationStep[] = [], crossFieldValidators: CrossFieldValidator[] = [], temporalValidators: TemporalValidator[] = []) {
    this.steps = steps;
    this.crossFieldValidators = crossFieldValidators;
    this.temporalValidators = temporalValidators;
  }

  public addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public addCrossFieldValidator(validator: CrossFieldValidator): this {
    this.crossFieldValidators.push(validator);
    return this;
  }

  public addTemporalValidator(validator: TemporalValidator): this {
    this.temporalValidators.push(validator);
    return this;
  }

  private async executeSteps(initialContext: ValidationContext): Promise<{ isValid: boolean; context: ValidationContext; error?: string }> {
    let context: ValidationContext = { ...initialContext };

    for (const step of this.steps) {
      const result = await step.execute(context);
      if (!result.isValid) {
        return { isValid: false, context: result.context, error: result.error };
      }
      context = result.context;
    }
    return { isValid: true, context: context, error: undefined };
  }

  private validateCrossFields(data: Record<string, unknown>, context: ValidationContext): string[] {
    const errors: string[] = [];
    for (const validator of this.crossFieldValidators) {
      const result = validator.validate(data, context);
      if (!result.isValid) {
        errors.push(result.error || "Cross-field validation failed.");
      }
    }
    return errors;
  }

  private validateTemporal(data: Record<string, unknown>, context: ValidationContext): string[] {
    const errors: string[] = [];
    for (const validator of this.temporalValidators) {
      const result = validator.validate(data, context);
      if (!result.isValid) {
        errors.push(result.error || "Temporal validation failed.");
      }
    }
    return errors;
  }

  public async validate(output: ToolResultMessage, initialContext: ValidationContext): Promise<{ isValid: boolean; errors: string[] }> {
    const initialContextCopy: ValidationContext = { ...initialContext, state: { ...initialContext.state } };

    // 1. Execute sequential steps
    const stepResult = await this.executeSteps(initialContextCopy);

    if (!stepResult.isValid) {
      return { isValid: false, errors: [`Pipeline step failed: ${stepResult.error || 'Unknown step failure'}`] };
    }

    // 2. Validate cross-field dependencies
    const crossFieldErrors = this.validateCrossFields(output, stepResult.context);
    if (crossFieldErrors.length > 0) {
      return { isValid: false, errors: [...crossFieldErrors] };
    }

    // 3. Validate temporal consistency
    const temporalErrors = this.validateTemporal(output, stepResult.context);
    if (temporalErrors.length > 0) {
      return { isValid: false, errors: [...temporalErrors] };
    }

    return { isValid: true, errors: [] };
  }
}

export const createValidationPipeline = (
  steps: ValidationStep[] = [],
  crossFieldValidators: CrossFieldValidator[] = [],
  temporalValidators: TemporalValidator[] = []
): ValidationPipeline => {
  return new ValidationPipeline(steps, crossFieldValidators, temporalValidators);
};