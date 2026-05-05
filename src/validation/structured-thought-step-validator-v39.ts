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

export type ThoughtStep = {
  stepId: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type CrossStepValidationRule = (
  stepN: ThoughtStep,
  stepNPlus1: ThoughtStep
) => { isValid: boolean; message: string };

export class StructuredThoughtStepValidator {
  private rules: CrossStepValidationRule[] = [];

  constructor() {}

  addRule(rule: CrossStepValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(steps: ThoughtStep[]): { isValid: boolean; errors: string[] } {
    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    let allValid = true;

    for (let i = 0; i < steps.length - 1; i++) {
      const stepN = steps[i];
      const stepNPlus1 = steps[i + 1];

      for (const rule of this.rules) {
        const validationResult = rule(stepN, stepNPlus1);
        if (!validationResult.isValid) {
          errors.push(`Step ${stepN.stepId} -> Step ${stepNPlus1.stepId}: ${validationResult.message}`);
          allValid = false;
        }
      }
    }

    return { isValid: allValid, errors: errors };
  }
}

export const createValidator = (): StructuredThoughtStepValidator => {
  return new StructuredThoughtStepValidator();
};