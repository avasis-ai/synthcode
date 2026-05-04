import { Validator, ValidationResult } from "./base-validator";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ThoughtStep = {
  stepIndex: number;
  content: ContentBlock[];
  reasoning?: string;
  observationId?: string;
};

export class StructuredThoughtStepValidatorV26 implements Validator<ThoughtStep[]> {
  validate(steps: ThoughtStep[]): ValidationResult {
    if (!steps || steps.length < 2) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];

    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];

      // Rule 1: Check if reasoning step references a previous observation
      if (currentStep.reasoning && !currentStep.observationId) {
        errors.push(`Step ${i} (Reasoning) must provide an observationId if reasoning is present.`);
      }

      // Rule 2: Check if observationId in current step matches a potential source
      if (currentStep.observationId) {
        const sourceFound = previousStep.observationId === currentStep.observationId;
        if (!sourceFound) {
          errors.push(`Step ${i} observationId '${currentStep.observationId}' does not match previous step's observationId.`);
        }
      }

      // Rule 3: Consistency check based on content blocks (simplified check)
      const currentContentHasThinking = currentStep.content.some(block => block.type === "thinking");
      const previousContentHasObservation = previousStep.content.some(block => block.type === "tool_result");

      if (currentContentHasThinking && !previousContentHasObservation) {
        errors.push(`Step ${i} contains thinking, but the previous step (${i-1}) did not appear to conclude with an observation.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}