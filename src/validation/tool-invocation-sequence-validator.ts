import { Message, ToolUseBlock } from "./types";

export interface ToolInvocationSequenceValidator {
  validate(
    toolCalls: ToolUseBlock[],
    context: Message[]
  ): { isValid: boolean; errors: string[] };
}

export class ToolInvocationSequenceValidatorImpl implements ToolInvocationSequenceValidator {
  validate(
    toolCalls: ToolUseBlock[],
    context: Message[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const executedToolIds = new Set<string>();

    if (toolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    for (let i = 0; i < toolCalls.length; i++) {
      const currentCall = toolCalls[i];

      // 1. Check for duplicate calls in the sequence
      if (executedToolIds.has(currentCall.id)) {
        errors.push(`Tool call with ID ${currentCall.id} is duplicated in the sequence.`);
        continue;
      }

      // 2. Check for implicit dependencies based on context (simplified check)
      // In a real system, this would involve analyzing the tool's expected inputs
      // against the results of previously executed tools in the context.
      // For this implementation, we'll simulate checking if the context provides
      // necessary information for the current tool call.

      const requiredContextKeys: Record<string, string[]> = {
        "get_user_profile": ["user_id"],
        "search_database": ["query"],
      };

      const requiredKeys = requiredContextKeys[currentCall.name];
      if (requiredKeys) {
        const contextHasRequired = context.some(message => {
          if (message.role === "tool" && message.content && typeof message.content === 'string') {
            // Simplified check: assume tool result content might contain necessary IDs
            return message.content.includes(requiredKeys[0]);
          }
          return false;
        });

        if (!contextHasRequired) {
          errors.push(
            `Tool call '${currentCall.name}' requires context information (e.g., ${requiredKeys.join(', ')}) which is missing or not visible in the preceding context.`
          );
        }
      }

      executedToolIds.add(currentCall.id);
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}

export const createToolInvocationSequenceValidator = (): ToolInvocationSequenceValidator => {
  return new ToolInvocationSequenceValidatorImpl();
};