import { Validator, ValidationResult } from "./validator-interface";

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
  reasoning_path?: {
    step: string;
    input_context: string;
    derived_logic: string;
  }[];
  confidence_score?: number;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export class StructuredThoughtStepValidatorV11 implements Validator {
  validate(data: any): ValidationResult {
    if (!Array.isArray(data) || data.length === 0) {
      return { isValid: false, errors: ["Input data must be a non-empty array."] };
    }

    const results: { isValid: boolean; errors: string[] }[] = [];

    for (const item of data) {
      if (typeof item !== 'object' || item === null) {
        results.push({ isValid: false, errors: ["Item must be a non-null object."] });
        continue;
      }

      if (item.type === 'thinking') {
        const thinkingBlock = item as ThinkingBlock;
        const errors = this.validateThinkingBlock(thinkingBlock);
        results.push({ isValid: errors.length === 0, errors });
      } else {
        results.push({ isValid: true, errors: [] });
      }
    }

    const allValid = results.every(r => r.isValid);
    const allErrors: string[] = results.flatMap(r => r.errors);

    return {
      isValid: allValid,
      errors: allErrors.length > 0 ? allErrors : ["Validation successful."]
    };
  }

  private validateThinkingBlock(block: ThinkingBlock): string[] {
    const errors: string[] = [];

    if (typeof block.thinking !== 'string' || block.thinking.trim().length === 0) {
      errors.push("Thinking block requires non-empty 'thinking' content.");
    }

    if (!Array.isArray(block.reasoning_path) || block.reasoning_path.length === 0) {
      errors.push("Structured thought requires a non-empty 'reasoning_path' array.");
    } else {
      for (let i = 0; i < block.reasoning_path.length; i++) {
        const step = block.reasoning_path[i];
        if (typeof step.step !== 'string' || step.step.trim().length === 0) {
          errors.push(`Reasoning path step ${i} is missing or empty 'step'.`);
        }
        if (typeof step.input_context !== 'string') {
          errors.push(`Reasoning path step ${i} is missing 'input_context'.`);
        }
        if (typeof step.derived_logic !== 'string' || step.derived_logic.trim().length === 0) {
          errors.push(`Reasoning path step ${i} is missing or empty 'derived_logic'.`);
        }
      }
    }

    if (typeof block.confidence_score !== 'number' || block.confidence_score < 0 || block.confidence_score > 1) {
      errors.push("Confidence score must be a number between 0.0 and 1.0.");
    }

    return errors;
  }
}