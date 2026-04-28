import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationContext = Record<string, unknown>;
type ValidationResult = { isValid: boolean; errors: string[]; context: ValidationContext };

interface ValidationStep {
  execute: (input: Record<string, unknown>, context: ValidationContext) => ValidationResult;
}

class TemporalDependencyStep implements ValidationStep {
  private readonly field: string;
  private readonly dependencyField: string;
  private readonly validator: (value: unknown, context: ValidationContext) => boolean;

  constructor(field: string, dependencyField: string, validator: (value: unknown, context: ValidationContext) => boolean) {
    this.field = field;
    this.dependencyField = dependencyField;
    this.validator = validator;
  }

  execute(input: Record<string, unknown>, context: ValidationContext): ValidationResult {
    const value = input[this.field];
    const dependencyValue = input[this.dependencyField];

    if (value === undefined || dependencyValue === undefined) {
      return { isValid: true, errors: [], context };
    }

    if (!this.validator(value, context)) {
      return { isValid: false, errors: [`Temporal constraint failed for ${this.field}: Value ${value} violates dependency on ${this.dependencyField} (${dependencyValue}).`], context };
    }

    return { isValid: true, errors: [], context };
  }
}

class CrossFieldConstraintStep implements ValidationStep {
  private readonly check: (input: Record<string, unknown>) => { isValid: boolean; message: string };

  constructor(check: (input: Record<string, unknown>) => { isValid: boolean; message: string }) {
    this.check = check;
  }

  execute(input: Record<string, unknown>, context: ValidationContext): ValidationResult {
    const { isValid, message } = this.check(input);
    if (!isValid) {
      return { isValid: false, errors: [message], context };
    }
    return { isValid: true, errors: [], context };
  }
}

class StructuredToolInputValidationPipelineV53 {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolInputValidationPipelineV53 {
    if (!StructuredToolInputValidationPipelineV53.instance) {
      StructuredToolInputValidationPipelineV53.instance = new StructuredToolInputValidationPipelineV53();
    }
    return StructuredToolInputValidationPipelineV53.instance;
  }

  private static instance: StructuredToolInputValidationPipelineV53;

  public addStep(step: ValidationStep): StructuredToolInputValidationPipelineV53 {
    this.steps.push(step);
    return this;
  }

  public validate(input: Record<string, unknown>, initialContext: ValidationContext = {}): ValidationResult {
    let currentContext: ValidationContext = { ...initialContext };
    let allErrors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      const result = step.execute(input, currentContext);
      if (!result.isValid) {
        allErrors.push(...result.errors);
        isValid = false;
      }
      currentContext = { ...currentContext, ...result.context };
    }

    return {
      isValid: isValid,
      errors: allErrors,
      context: currentContext,
    };
  }
}

export class ValidationBuilder {
  private pipeline: StructuredToolInputValidationPipelineV53 = StructuredToolInputValidationPipelineV53.getInstance();

  public addTemporalDependency(field: string, dependencyField: string, validator: (value: unknown, context: ValidationContext) => boolean): ValidationBuilder {
    const step = new TemporalDependencyStep(field, dependencyField, validator);
    this.pipeline.addStep(step);
    return this;
  }

  public addCrossFieldConstraint(check: (input: Record<string, unknown>) => { isValid: boolean; message: string }): ValidationBuilder {
    const step = new CrossFieldConstraintStep(check);
    this.pipeline.addStep(step);
    return this;
  }

  public build(): StructuredToolInputValidationPipelineV53 {
    return this.pipeline;
  }
}

export { ValidationBuilder };