import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StructuredToolOutputValidationStep {
  validate(output: Record<string, unknown>): ValidationResult;
}

export abstract class StructuredToolOutputValidator {
  protected steps: StructuredToolOutputValidationStep[] = [];

  public addStep(step: StructuredToolOutputValidationStep): this {
    this.steps.push(step);
    return this;
  }

  public validate(output: Record<string, unknown>): ValidationResult {
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

export class TemporalConstraintValidator implements StructuredToolOutputValidationStep {
  private readonly fieldA: string;
  private readonly fieldB: string;
  private readonly comparison: (a: any, b: any) => boolean;

  constructor(fieldA: string, fieldB: string, comparison: (a: any, b: any) => boolean) {
    this.fieldA = fieldA;
    this.fieldB = fieldB;
    this.comparison = comparison;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    const valA = output[this.fieldA];
    const valB = output[this.fieldB];

    if (valA === undefined || valB === undefined) {
      return { isValid: true, errors: [] };
    }

    if (!this.comparison(valA, valB)) {
      return {
        isValid: false,
        errors: [`Temporal constraint failed between ${this.fieldA} and ${this.fieldB}.`],
      };
    }

    return { isValid: true, errors: [] };
  }
}

export class CrossFieldDependencyValidator implements StructuredToolOutputValidationStep {
  private readonly requiredField: string;
  private readonly dependencyCheck: (data: Record<string, unknown>) => boolean;

  constructor(requiredField: string, dependencyCheck: (data: Record<string, unknown>) => boolean) {
    this.requiredField = requiredField;
    this.dependencyCheck = dependencyCheck;
  }

  validate(output: Record<string, unknown>): ValidationResult {
    if (output[this.requiredField] === undefined) {
      return { isValid: true, errors: [] };
    }

    if (!this.dependencyCheck(output)) {
      return {
        isValid: false,
        errors: [`Cross-field dependency failed involving ${this.requiredField}.`],
      };
    }

    return { isValid: true, errors: [] };
  }
}

export class StructuredToolOutputValidationPipelineV58 extends StructuredToolOutputValidator {
  public static buildPipeline(steps: StructuredToolOutputValidationStep[]): StructuredToolOutputValidationPipelineV58 {
    const pipeline = new StructuredToolOutputValidationPipelineV58();
    for (const step of steps) {
      pipeline.addStep(step);
    }
    return pipeline;
  }
}