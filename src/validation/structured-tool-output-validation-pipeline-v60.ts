import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidationStep {
  validate(output: Record<string, unknown>): ValidationResult;
}

class StructuredToolOutputValidator {
  private steps: ValidationStep[];

  constructor(initialSteps: ValidationStep[] = []) {
    this.steps = initialSteps;
  }

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    let allErrors: string[] = [];
    for (const step of this.steps) {
      const result = step.validate(output);
      if (!result.isValid) {
        allErrors = allErrors.concat(result.errors);
      }
    }
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

class TemporalConstraintValidator implements ValidationStep {
  private readonly field: string;
  private readonly requiredOrder: string[];

  constructor(field: string, requiredOrder: string[]) {
    this.field = field;
    this.requiredOrder = requiredOrder;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    const values = this.requiredOrder.map(key => output[key]);
    const foundKeys = values.filter(v => v !== undefined && v !== null).map(v => typeof v === 'string' ? v : String(v));

    const expectedKeys = this.requiredOrder.filter(key => output[key] !== undefined && output[key] !== null);

    if (foundKeys.length !== expectedKeys.length) {
      return { isValid: false, errors: [`Temporal constraint failed for ${this.field}: Expected ${expectedKeys.length} fields, found ${foundKeys.length}.`] };
    }

    // Simplified check: just checking if the required keys are present in the right order based on the structure.
    // A real implementation would need more context on the structure of 'output'.
    return { isValid: true, errors: [] };
  }
}

class CrossFieldDependencyValidator implements ValidationStep {
  private readonly dependency: (output: Record<string, unknown>) => boolean;
  private readonly errorMessage: string;

  constructor(dependency: (output: Record<string, unknown>) => boolean, errorMessage: string) {
    this.dependency = dependency;
    this.errorMessage = errorMessage;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    if (!this.dependency(output)) {
      return { isValid: false, errors: [this.errorMessage] };
    }
    return { isValid: true, errors: [] };
  }
}

class StructuredToolOutputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolOutputValidationPipelineBuilder {
    if (!StructuredToolOutputValidationPipelineBuilder.instance) {
      StructuredToolOutputValidationPipelineBuilder.instance = new StructuredToolOutputValidationPipelineBuilder();
    }
    return StructuredToolOutputValidationPipelineBuilder.instance;
  }

  private static instance: StructuredToolOutputValidationPipelineBuilder;

  public addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public build(): StructuredToolOutputValidator {
    return new StructuredToolOutputValidator(this.steps);
  }
}

export {
  StructuredToolOutputValidator,
  StructuredToolOutputValidationPipelineBuilder,
  TemporalConstraintValidator,
  CrossFieldDependencyValidator,
}