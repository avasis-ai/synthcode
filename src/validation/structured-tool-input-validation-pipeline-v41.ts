import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ValidationContext {
  input: Record<string, unknown>;
  history: Message[];
  // Add any other context needed for complex validation (e.g., current time)
  contextualData?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationStep {
  execute(context: ValidationContext): ValidationResult;
}

export interface ConditionalValidationStep extends ValidationStep {
  condition: (context: ValidationContext) => boolean;
  execute(context: ValidationContext): ValidationResult;
}

export interface TemporalValidationStep extends ValidationStep {
  // Logic to check time constraints based on input/context
  execute(context: ValidationContext): ValidationResult;
}

export class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static getInstance(): StructuredToolInputValidationPipeline {
    if (!StructuredToolInputValidationPipeline.instance) {
      StructuredToolInputValidationPipeline.instance = new StructuredToolInputValidationPipeline();
    }
    return StructuredToolInputValidationPipeline.instance;
  }

  public addStep(step: ValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addConditionalStep(step: ConditionalValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public addTemporalStep(step: TemporalValidationStep): StructuredToolInputValidationPipeline {
    this.steps.push(step);
    return this;
  }

  public validate(context: ValidationContext): ValidationResult {
    let accumulatedResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    for (const step of this.steps) {
      const result = step.execute(context);
      
      if (!result.isValid) {
        accumulatedResult.isValid = false;
        accumulatedResult.errors.push(...result.errors);
      } else {
        accumulatedResult.errors.push(...result.errors);
      }
      
      accumulatedResult.warnings.push(...result.warnings);
    }

    return accumulatedResult;
  }

  private static instance: StructuredToolInputValidationPipeline | null = null;
}

export const buildPipeline = (): StructuredToolInputValidationPipeline => {
  return StructuredToolInputValidationPipeline.getInstance();
};