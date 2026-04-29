import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

interface ValidationStep {
  execute: (input: Record<string, unknown>, context: Record<string, unknown>) => ValidationResult;
}

class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[];

  constructor(steps: ValidationStep[]) {
    this.steps = steps;
  }

  validate(input: Record<string, unknown>, initialContext: Record<string, unknown> = {}): ValidationResult {
    let currentContext = { ...initialContext, ...input };
    let accumulatedErrors: string[] = [];

    for (const step of this.steps) {
      const result = step.execute(input, currentContext);
      if (!result.isValid) {
        accumulatedErrors.push(...result.errors);
      }
      // Update context with the step's context if it's available and valid
      if (result.context) {
        currentContext = { ...currentContext, ...result.context };
      }
    }

    return {
      isValid: accumulatedErrors.length === 0,
      errors: accumulatedErrors,
      context: currentContext,
    };
  }
}

class StructuredToolInputValidationPipelineBuilder {
  private steps: ValidationStep[] = [];

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  build(): StructuredToolInputValidationPipeline {
    return new StructuredToolInputValidationPipeline(this.steps);
  }
}

export class RequiredFieldStep implements ValidationStep {
  constructor(private fieldName: string) {}

  execute(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const value = input[this.fieldName];
    const isValid = value !== undefined && value !== null && (typeof value !== 'string' || value.trim() !== '');

    if (!isValid) {
      return {
        isValid: false,
        errors: [`Field '${this.fieldName}' is required.`],
        context: context,
      };
    }

    return {
      isValid: true,
      errors: [],
      context: { ...context, [this.fieldName]: value },
    };
  }
}

export class CrossFieldDependencyStep implements ValidationStep {
  constructor(private dependency: (input: Record<string, unknown>, context: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
    contextUpdate: Record<string, unknown>;
  }) {
    // The dependency function itself is the core logic, we wrap it to fit the ValidationStep interface
  }

  execute(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const result = this.dependency(input, context);
    return {
      isValid: result.isValid,
      errors: result.errors,
      context: { ...context, ...result.contextUpdate },
    };
  }
}

export class CustomLogicStep implements ValidationStep {
  constructor(private logic: (input: Record<string, unknown>, context: Record<string, unknown>) => {
    isValid: boolean;
    errors: string[];
    contextUpdate: Record<string, unknown>;
  }) {}

  execute(input: Record<string, unknown>, context: Record<string, unknown>): ValidationResult {
    const result = this.logic(input, context);
    return {
      isValid: result.isValid,
      errors: result.errors,
      context: { ...context, ...result.contextUpdate },
    };
  }
}

export const buildValidationPipeline = (steps: ValidationStep[]): StructuredToolInputValidationPipeline => {
  const builder = new StructuredToolInputValidationPipelineBuilder();
  steps.forEach(step => builder.addStep(step));
  return builder.build();
};