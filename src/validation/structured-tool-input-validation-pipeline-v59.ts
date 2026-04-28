import { Message } from "./message-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedData: Record<string, unknown>;
}

export interface ValidationStep {
  validate(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  private constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  public static create(initialSteps: ValidationStep[]): StructuredToolInputValidationPipeline {
    return new StructuredToolInputValidationPipeline(initialSteps);
  }

  public validate(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    let currentData: Record<string, unknown> = { ...input };
    let accumulatedErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(currentData, context);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
      }
      // Update data with the result of the step, prioritizing the step's output
      currentData = { ...currentData, ...result.validatedData };
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      validatedData: currentData,
    };
  }

  public static build(): PipelineBuilder {
    return new PipelineBuilder();
  }
}

export class PipelineBuilder {
  private steps: ValidationStep[] = [];

  public withRequiredField(fieldName: string): PipelineBuilder {
    this.steps.push(new RequiredFieldStep(fieldName));
    return this;
  }

  public withCrossFieldDependency(
    fieldName: string,
    dependencyCheck: (data: Record<string, unknown>) => { isValid: boolean; error: string }
  ): PipelineBuilder {
    this.steps.push(new CrossFieldDependencyStep(fieldName, dependencyCheck));
    return this;
  }

  public build(): StructuredToolInputValidationPipeline {
    return StructuredToolInputValidationPipeline.create(this.steps);
  }
}

class RequiredFieldStep implements ValidationStep {
  private fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  public validate(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const value = input[this.fieldName];
    const isValid = value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');

    if (!isValid) {
      return {
        isValid: false,
        errors: [`Field "${this.fieldName}" is required and cannot be empty.`],
        validatedData: { ...input },
      };
    }

    return {
      isValid: true,
      errors: [],
      validatedData: { ...input, [this.fieldName]: value },
    };
  }
}

class CrossFieldDependencyStep implements ValidationStep {
  private fieldName: string;
  private dependencyCheck: (data: Record<string, unknown>) => { isValid: boolean; error: string };

  constructor(fieldName: string, dependencyCheck: (data: Record<string, unknown>) => { isValid: boolean; error: string }) {
    this.fieldName = fieldName;
    this.dependencyCheck = dependencyCheck;
  }

  public validate(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const check = this.dependencyCheck(input);
    if (!check.isValid) {
      return {
        isValid: false,
        errors: [`Dependency check failed for "${this.fieldName}": ${check.error}`],
        validatedData: { ...input },
      };
    }

    return {
      isValid: true,
      errors: [],
      validatedData: { ...input },
    };
  }
}