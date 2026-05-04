import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ThoughtStep {
  stepId: string;
  content: ContentBlock[];
  metadata: Record<string, any>;
}

export interface ThoughtStepValidator {
  validate(
    currentStep: ThoughtStep,
    previousStep: ThoughtStep | null,
    context: { history: Message[] }
  ): { isValid: boolean; errors: string[] };
}

class JustificationValidator implements ThoughtStepValidator {
  validate(
    currentStep: ThoughtStep,
    previousStep: ThoughtStep | null,
    context: { history: Message[] }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!previousStep) {
      return { isValid: true, errors: [] };
    }

    const currentThinking = currentStep.content.find(
      (block) => (block as ThinkingBlock).type === "thinking"
    );

    if (!currentThinking) {
      return { isValid: false, errors: ["A 'thinking' block is required in the current step for justification."] };
    }

    const previousAction = previousStep.content.find(
      (block) => (block as ToolUseBlock).type === "tool_use"
    );

    if (previousAction && !currentThinking.thinking.includes("reasoning for")) {
      errors.push(
        "The current thinking step must explicitly state the reasoning for the action taken in the previous step."
      );
    }

    return { isValid: errors.length === 0, errors };
  }
}

class ActionConsistencyValidator implements ThoughtStepValidator {
  validate(
    currentStep: ThoughtStep,
    previousStep: ThoughtStep | null,
    context: { history: Message[] }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!previousStep) {
      return { isValid: true, errors: [] };
    }

    const currentToolUse = currentStep.content.find(
      (block) => (block as ToolUseBlock).type === "tool_use"
    );

    if (currentToolUse) {
      const previousToolUse = previousStep.content.find(
        (block) => (block as ToolUseBlock).type === "tool_use"
      );

      if (previousToolUse && currentToolUse.name === previousToolUse.name) {
        errors.push(
          "Consecutive steps cannot use the same tool without an intervening thought/reasoning step."
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export class StructuredThoughtStepValidatorAdvanced {
  private validators: ThoughtStepValidator[];

  constructor() {
    this.validators = [
      new JustificationValidator(),
      new ActionConsistencyValidator()
    ];
  }

  validate(
    currentStep: ThoughtStep,
    previousStep: ThoughtStep | null,
    context: { history: Message[] }
  ): { isValid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(currentStep, previousStep, context);
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}