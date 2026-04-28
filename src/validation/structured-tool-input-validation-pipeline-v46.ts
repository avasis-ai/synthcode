import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

interface ValidationStep {
  validate: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

interface TemporalConstraintValidator extends ValidationStep {
  validate: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

interface ExternalDataValidator extends ValidationStep {
  validate: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

class StructuredToolInputValidationPipelineV46 {
  private steps: ValidationStep[] = [];

  private constructor() {}

  private static getInstance(): StructuredToolInputValidationPipelineV46 {
    if (!StructuredToolInputValidationPipelineV46.instance) {
      StructuredToolInputValidationPipelineV46.instance = new StructuredToolInputValidationPipelineV46();
    }
    return StructuredToolInputValidationPipelineV46.instance;
  }

  public static get instance(): StructuredToolInputValidationPipelineV46 {
    return StructuredToolInputValidationPipelineV46.getInstance();
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationPipelineV46 {
    this.steps.push(step);
    return this;
  }

  public addTemporalConstraint(validator: TemporalConstraintValidator): StructuredToolInputValidationPipelineV46 {
    return this.addStep(validator);
  }

  public addExternalDataConstraint(validator: ExternalDataValidator): StructuredToolInputValidationPipelineV46 {
    return this.addStep(validator);
  }

  public validate(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    let allErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.validate(input, context);
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

export { StructuredToolInputValidationPipelineV46 };