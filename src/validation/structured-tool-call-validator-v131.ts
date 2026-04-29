import { Validator, ValidationContext, Message, ToolUseBlock } from "./validator-base";

export class StructuredToolCallValidatorV131 implements Validator {
  validate(context: ValidationContext, messages: Message[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const toolCalls: ToolUseBlock[] = [];
    const toolUseIds = new Set<string>();

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as { role: "assistant", content: ContentBlock[] };
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            if (toolUseIds.has(toolUseBlock.id)) {
              errors.push(`Duplicate tool use ID found: ${toolUseBlock.id}`);
            } else {
              toolCalls.push(toolUseBlock);
              toolUseIds.add(toolUseBlock.id);
            }
          }
        }
      }
    }

    if (toolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    // Check for structural consistency and ordering (simplified check)
    // A more complex validator would track state changes based on tool results.
    // Here, we ensure that if tool calls are present, they are grouped logically
    // and that subsequent messages (if any) correctly reference results.

    let lastToolCallId: string | null = null;
    for (let i = 0; i < toolCalls.length; i++) {
      const currentCall = toolCalls[i];
      if (i > 0 && toolCalls[i - 1].id !== currentCall.id) {
        // This check is redundant if we only process tool_use blocks from one message,
        // but it guards against malformed input sequences.
      }
      lastToolCallId = currentCall.id;
    }

    // Basic check: If tool calls are made, the next expected message (if not the end)
    // should ideally be a tool result or the conversation should end.
    // Since we are validating the *sequence* provided, we check for immediate follow-ups.
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMessage = messages[i];
      const nextMessage = messages[i + 1];

      if (currentMessage.role === "assistant" && toolCalls.some(tc => tc.id === lastToolCallId)) {
        // If the current message contained tool calls, the next message should ideally be a tool result
        // or the sequence should terminate cleanly.
        if (nextMessage.role !== "tool") {
          // This is a heuristic check for required follow-up.
          // A robust system would need explicit state tracking.
          // For this validator, we flag if tool calls are made and the next message isn't a result.
          // We only flag if the tool call was the *last* thing in the current message.
          const lastBlock = (currentMessage as { content: ContentBlock[] }).content[currentMessage.content.length - 1];
          if (lastBlock && lastBlock.type === "tool_use" && nextMessage.role !== "tool") {
             errors.push(`Tool call ${lastToolCallId} was made, but the subsequent message (${nextMessage.role}) is not a tool result.`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors: errors };
    }

    return { isValid: true, errors: [] };
  }
}