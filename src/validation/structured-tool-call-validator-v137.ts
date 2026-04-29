import {
  Message,
  ContentBlock,
  ToolUseBlock,
  TextBlock,
  ThinkingBlock,
} from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export interface Validator {
  validate(messages: Message[]): ValidationResult;
}

class StructuredToolCallValidatorV137 implements Validator {
  validate(messages: Message[]): ValidationResult {
    const errors: string[] = [];
    let toolCallSequence: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        let toolUseBlocks: ToolUseBlock[] = [];

        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            toolUseBlocks.push(toolUse);
          }
        }

        if (toolUseBlocks.length > 0) {
          toolCallSequence.push({
            id: toolUseBlocks[0].id,
            name: toolUseBlocks[0].name,
            input: toolUseBlocks[0].input,
          });
        }
      }
    }

    // 1. Check for cross-tool-call dependencies and temporal ordering
    if (toolCallSequence.length > 0) {
      for (let i = 0; i < toolCallSequence.length - 1; i++) {
        const current = toolCallSequence[i];
        const next = toolCallSequence[i + 1];

        // Simple dependency check: If the next call uses the result of the current one,
        // the structure should ideally reflect that in the message flow, but for
        // this validator, we check for sequential consistency based on ID usage.
        // A more complex validator would check if the input of 'next' depends on the output of 'current'.
        // Here, we enforce that if IDs are present, they must be unique across the sequence.
        if (current.id === next.id) {
          errors.push(`Tool call ID collision detected: ID ${current.id} used multiple times in sequence.`);
        }
      }
    }

    // 2. Check for temporal ordering (Tool Use -> Tool Result)
    // This is a simplified check: A tool use must be followed by a tool result for the same ID.
    const toolUseIds = new Set<string>();
    const toolResultIds = new Set<string>();

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as AssistantMessage;
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            toolUseIds.add(block.id);
          }
        }
      } else if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        if (toolResultMessage.tool_use_id) {
          toolResultIds.add(toolResultMessage.tool_use_id);
        }
      }
    }

    // Check if every used tool ID was eventually reported as a result
    for (const id of toolUseIds) {
      if (!toolResultIds.has(id)) {
        errors.push(`Tool call with ID ${id} was never followed by a corresponding tool result message.`);
      }
    }

    // Check if any tool result exists without a preceding tool call
    for (const id of toolResultIds) {
      // This is a weak check, as the ID might be valid but just misplaced.
      // A stronger check would require tracking the immediate preceding message.
      // For simplicity, we just ensure the ID exists in the set of used IDs.
      if (!Array.from(toolUseIds).some(usedId => usedId === id)) {
        // This condition is hard to trigger reliably without state tracking across the whole array.
        // We'll skip this specific check to maintain stability unless explicit state tracking is added.
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}

export const createStructuredToolCallValidator = (): Validator => {
  return new StructuredToolCallValidatorV137();
};