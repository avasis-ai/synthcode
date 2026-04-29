import {
  Message,
  ToolUseBlock,
  ToolResultMessage,
} from "./types";

export class StructuredToolCallValidatorAdvanced {
  validate(
    toolCalls: ToolUseBlock[],
    history: Message[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const toolCallIds: Set<string> = new Set<string>();
    const toolCallSequence: ToolUseBlock[] = [];

    for (const call of toolCalls) {
      if (toolCallIds.has(call.id)) {
        errors.push(`Duplicate tool call ID found: ${call.id}`);
      }
      toolCallIds.add(call.id);
      toolCallSequence.push(call);
    }

    if (toolCallSequence.length === 0) {
      return { isValid: true, errors: [] };
    }

    // 1. Check for temporal consistency and dependency fulfillment
    for (let i = 0; i < toolCallSequence.length; i++) {
      const currentCall = toolCallSequence[i];
      const previousMessage = history.find(
        (msg) => msg.role === "assistant" && msg.content.some(
          (block) =>
            (block as ToolUseBlock).id === currentCall.id
          )
        )
      );

      if (i > 0) {
        const previousCall = toolCallSequence[i - 1];
        const previousToolUseId = previousCall.id;

        // Basic dependency check: If the current call depends on a previous result,
        // we must ensure that result is present in the history before this turn.
        // This simplified check assumes sequential execution where the result
        // for the previous call must precede the current call in the history.
        const resultExists = history.some(
          (msg) =>
            msg.role === "tool" &&
            (msg as ToolResultMessage).tool_use_id === previousToolUseId
          )
        );

        if (!resultExists) {
          errors.push(
            `Temporal dependency error: Tool call ${currentCall.id} at index ${i} requires the result of the previous call (${previousToolUseId}) to be present in the history.`
          );
        }
      }
    }

    // 2. Check for structural validity (e.g., required fields)
    for (const call of toolCallSequence) {
      if (!call.name || !call.input) {
        errors.push(`Tool call ${call.id} is missing required 'name' or 'input'.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}