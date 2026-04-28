import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  context: Record<string, unknown>;
};

interface ValidationContext {
  inputData: Record<string, unknown>;
  history: Message[];
  getPreviousStepResult: () => ValidationResult;
  getCurrentContext: () => Record<string, unknown>;
}

interface ValidationStep {
  execute: (context: ValidationContext) => ValidationResult;
}

class StructuredToolInputValidationPipeline {
  private steps: ValidationStep[] = [];

  constructor() {}

  addStep(step: ValidationStep): this {
    this.steps.push(step);
    return this;
  }

  validate(initialData: Record<string, unknown>, history: Message[]): ValidationResult {
    let currentContext: Record<string, unknown> = { ...initialData };
    let previousResult: ValidationResult = { isValid: true, errors: [], context: { ...initialData } };

    const contextFactory: (stepIndex: number) => ValidationContext = (stepIndex) => ({
      inputData: initialData,
      history: history,
      getPreviousStepResult: () => previousResult,
      getCurrentContext: () => currentContext,
    });

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const context = contextFactory(i);
      const result = step.execute(context);

      previousResult = result;
      currentContext = { ...currentContext, ...result.context };
    }

    return previousResult;
  }
}

class TemporalValidator implements ValidationStep {
  execute(context: ValidationContext): ValidationResult {
    const { history } = context;
    const errors: string[] = [];
    let isValid = true;

    if (history.length < 2) {
      return { isValid: true, errors: [], context: context.getCurrentContext() };
    }

    // Simple temporal check: ensure the last two messages are not identical in content type
    const lastMsg = history[history.length - 1];
    const secondLastMsg = history[history.length - 2];

    if (lastMsg.role === secondLastMsg.role && lastMsg.content === secondLastMsg.content) {
      errors.push("Temporal constraint violated: Consecutive messages have identical content.");
      isValid = false;
    }

    return { isValid, errors, context: context.getCurrentContext() };
  }
}

class CrossFieldValidator implements ValidationStep {
  execute(context: ValidationContext): ValidationResult {
    const { inputData } = context;
    const errors: string[] = [];
    let isValid = true;

    const requiredFieldA = 'requiredFieldA' as keyof typeof inputData;
    const requiredFieldB = 'requiredFieldB' as keyof typeof inputData;

    if (inputData[requiredFieldA] && typeof inputData[requiredFieldA] === 'string' && inputData[requiredFieldA].toLowerCase() === 'admin') {
      if (!inputData[requiredFieldB] || typeof inputData[requiredFieldB] !== 'boolean') {
        errors.push("Cross-field validation failed: If requiredFieldA is 'admin', requiredFieldB must be a boolean.");
        isValid = false;
      }
    }

    return { isValid, errors, context: context.getCurrentContext() };
  }
}

export { StructuredToolInputValidationPipeline, TemporalValidator, CrossFieldValidator };