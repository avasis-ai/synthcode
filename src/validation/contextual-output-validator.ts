import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ExecutionContext {
  history: Message[];
  globalState: Record<string, unknown>;
  currentStep: string;
}

export interface ContextualValidationStep<T> {
  validate(data: T, context: ExecutionContext): { isValid: boolean; errors: string[] };
}

export class ContextualOutputValidator<T> {
  private steps: ContextualValidationStep<T>[] = [];

  addStep(step: ContextualValidationStep<T>): this {
    this.steps.push(step);
    return this;
  }

  validate(data: T, context: ExecutionContext): { isValid: boolean; errors: string[] } {
    let allErrors: string[] = [];
    let isValid = true;

    for (const step of this.steps) {
      const result = step.validate(data, context);
      if (!result.isValid) {
        isValid = false;
        allErrors = [...allErrors, ...result.errors];
      }
    }

    return { isValid, errors: allErrors };
  }
}