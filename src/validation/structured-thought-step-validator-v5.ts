import { Validator, ValidationContext } from "./base-validator";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export interface ContentBlock {
  type: "text" | "tool_use" | "thinking";
}

export interface TextBlock extends ContentBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock extends ContentBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock extends ContentBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_result: string };

export class StructuredThoughtStepValidatorV5 extends Validator {
  validate(context: ValidationContext, step: any): { isValid: boolean; errors: string[] } {
    const history = context.history;
    const currentStep = step;

    if (!currentStep || typeof currentStep !== 'object') {
      return { isValid: false, errors: ["Invalid step provided."] };
    }

    const errors: string[] = [];

    // 1. Basic structure check (assuming step is an object containing content/role)
    if (!currentStep.role || !currentStep.content) {
      errors.push("Step must contain 'role' and 'content'.");
    }

    // 2. Advanced dependency check based on history
    if (history && history.length > 0) {
      const lastStep = history[history.length - 1];

      // Example Dependency Rule: If the current step is an 'assistant' thought,
      // it must reference a specific output ID from the step two steps ago (N-2).
      if (currentStep.role === "assistant" && Array.isArray(currentStep.content) && currentStep.content.some((block: any) => block.type === "thinking")) {
        const thinkingBlock = currentStep.content.find((block: any) => block.type === "thinking") as ThinkingBlock;
        if (thinkingBlock && !thinkingBlock.thinking.includes("ReferenceID:")) {
          errors.push("Assistant thinking step must explicitly reference an ID from the step two steps prior (N-2).");
        } else {
          // Simple check to see if the reference pattern exists
          const referenceMatch = thinkingBlock.thinking.match(/ReferenceID:([a-zA-Z0-9_]+)/);
          if (referenceMatch) {
            const requiredId = referenceMatch[1];
            const targetStep = history[history.length - 2];
            if (targetStep && targetStep.role === "tool" && targetStep.content.includes(requiredId)) {
              // Dependency satisfied
            } else {
              errors.push(`Dependency failed: Required reference ID '${requiredId}' not found in the step two steps prior (N-2).`);
            }
          }
        }
      }

      // Example Dependency Rule 2: If the current step is a tool result, it must follow a tool use step.
      if (currentStep.role === "tool" && !history.some((h: any) => h.role === "assistant" && h.content.some((block: any) => block.type === "tool_use"))) {
        errors.push("Tool result step must immediately follow an assistant step containing a tool use block.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}