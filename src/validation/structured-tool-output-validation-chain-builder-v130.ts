import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type Validator<T> = (context: { message: Message; data: Record<string, unknown> }) => { isValid: boolean; error?: string; data?: Record<string, unknown> };
type Condition = (context: { message: Message; data: Record<string, unknown> }) => boolean;

interface ValidationStep {
  condition: Condition;
  validator: Validator<any>;
}

export class StructuredToolOutputValidationChainBuilder {
  private steps: ValidationStep[] = [];

  private constructor() {}

  public static create(): StructuredToolOutputValidationChainBuilder {
    return new StructuredToolOutputValidationChainBuilder();
  }

  public addStep(validator: Validator<any>): StructuredToolOutputValidationChainBuilder {
    this.steps.push({
      condition: () => true,
      validator: validator,
    });
    return this;
  }

  public addStepIf(condition: Condition, validator: Validator<any>): StructuredToolOutputValidationChainBuilder {
    this.steps.push({
      condition: condition,
      validator: validator,
    });
    return this;
  }

  public build(): {
    execute: (context: { message: Message; data: Record<string, unknown> }) => { isValid: boolean; error?: string; finalData: Record<string, unknown> };
  } {
    const execute = (context: { message: Message; data: Record<string, unknown> }): { isValid: boolean; error?: string; finalData: Record<string, unknown> } => {
      let currentData: Record<string, unknown> = { ...context.data };

      for (const step of this.steps) {
        if (!step.condition(context)) {
          continue;
        }

        const result = step.validator(context);

        if (!result.isValid) {
          return { isValid: false, error: result.error || "Validation failed at a step.", finalData: currentData };
        }

        if (result.data) {
          currentData = { ...currentData, ...result.data };
        }
      }

      return { isValid: true, error: undefined, finalData: currentData };
    };

    return { execute };
  }
}