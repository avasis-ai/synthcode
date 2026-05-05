import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ThoughtStep {
  stepId: string;
  content: Message;
}

export type StepValidatorRule = (
  previousStep: ThoughtStep,
  currentStep: ThoughtStep
) => {
  isValid: boolean;
  message: string;
};

export class StructuredThoughtStepValidatorV32 {
  private rules: Map<string, StepValidatorRule> = new Map();

  constructor() {}

  registerRule(ruleName: string, rule: StepValidatorRule): void {
    this.rules.set(ruleName, rule);
  }

  validateSequence(steps: ThoughtStep[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let isValid = true;

    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i];

      if (i === 0) {
        continue;
      }

      const previousStep = steps[i - 1];

      for (const [ruleName, rule] of this.rules.entries()) {
        const { isValid: ruleValid, message: ruleMessage } = rule(
          previousStep,
          currentStep
        );
        if (!ruleValid) {
          errors.push(
            `Validation failed for rule '${ruleName}' between Step ${previousStep.stepId} and Step ${currentStep.stepId}: ${ruleMessage}`
          );
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }
}