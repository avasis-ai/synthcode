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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export class StructuredThoughtStepValidatorV19 implements Validator {
  validate(data: any): ValidationResult {
    if (!Array.isArray(data) || data.length === 0) {
      return { isValid: false, errors: ["Input data must be a non-empty array of thought steps."] };
    }

    const steps = data as LoopEvent[];
    const requiredComponents = ["reasoning", "evidence_check", "next_action_plan"];
    const foundComponents: Record<string, boolean> = {
      reasoning: false,
      evidence_check: false,
      next_action_plan: false,
    };

    let currentStepIndex = 0;

    for (const step of steps) {
      if (typeof step !== 'object' || step === null) {
        return { isValid: false, errors: [`Step at index ${currentStepIndex} is not a valid object.`] };
      }

      if (step.type === 'thinking') {
        const thinkingContent = step.thinking;

        if (!thinkingContent) {
          return { isValid: false, errors: [`Thinking block at index ${currentStepIndex} must contain 'thinking' content.`] };
        }

        // Simplified structural check based on content analysis
        if (!thinkingContent.includes("Reasoning:")) {
          return { isValid: false, errors: [`Thinking block at index ${currentStepIndex} is missing required 'Reasoning:' marker.`] };
        }
        if (!thinkingContent.includes("Evidence Check:")) {
          return { isValid: false, errors: [`Thinking block at index ${currentStepIndex} is missing required 'Evidence Check:' marker.`] };
        }
        if (!thinkingContent.includes("Next Action Plan:")) {
          return { isValid: false, errors: [`Thinking block at index ${currentStepIndex} is missing required 'Next Action Plan:' marker.`] };
        }

        // Component tracking (assuming sequential appearance in the thinking block)
        if (!foundComponents.reasoning) {
          foundComponents.reasoning = true;
        }
        if (!foundComponents.evidence_check) {
          foundComponents.evidence_check = true;
        }
        if (!foundComponents.next_action_plan) {
          foundComponents.next_action_plan = true;
        }
      }
      currentStepIndex++;
    }

    const missingComponents: string[] = requiredComponents.filter(
      (component) => !foundComponents[component]
    );

    if (missingComponents.length > 0) {
      return {
        isValid: false,
        errors: [`Thought step sequence is incomplete. Missing components: ${missingComponents.join(', ')}`],
      };
    }

    return { isValid: true, errors: [] };
  }
}