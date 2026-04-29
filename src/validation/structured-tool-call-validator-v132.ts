import { Message, ToolUseBlock, ToolResultMessage } from "./types";

interface ValidationContext {
  history: Message[];
}

export class StructuredToolCallValidatorV132 {
  validate(toolCalls: ToolUseBlock[], context: ValidationContext): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const toolUseIds: string[] = toolCalls.map(tc => tc.id);

    if (!toolUseIds.every(id => id.length > 0)) {
      return { isValid: false, errors: ["All tool calls must have a non-empty ID."] };
    }

    // 1. Check for uniqueness of IDs
    const uniqueIds = new Set(toolUseIds);
    if (uniqueIds.size !== toolUseIds.length) {
      return { isValid: false, errors: ["Duplicate tool call IDs found within the provided list."] };
    }

    // 2. Check for logical consistency (Cross-tool call dependencies)
    // This is a simplified dependency check. In a real system, this would involve
    // analyzing the expected output schema of one tool vs. the input of another.
    const requiredDependencies: Record<string, string[]> = {
      "tool_b": ["tool_a"], // Example: tool_b requires output from tool_a
    };

    for (const toolCall of toolCalls) {
      const toolName = toolCall.name;
      if (requiredDependencies[toolName]) {
        const requiredPredecessors = requiredDependencies[toolName];
        const foundPredecessors = toolCalls.filter(tc => requiredPredecessors.includes(tc.name));

        // Simple check: ensure all required predecessor names are present in the list
        const missingDependencies = requiredPredecessors.filter(requiredName =>
          !toolCalls.some(tc => tc.name === requiredName)
        );

        if (missingDependencies.length > 0) {
          errors.push(`Tool '${toolName}' requires preceding tool calls: ${missingDependencies.join(', ')}.`);
        }
      }
    }

    // 3. Check for context relevance (Does the context suggest these tools are needed?)
    const lastMessage = context.history[context.history.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      const userContent = (lastMessage as any).content; // Assuming content is accessible
      const userText = (userContent as any)?.someBlock?.find((block: any) => block.type === "text")?.text || "";

      if (userText.length < 10 && toolCalls.length > 1) {
        errors.push("The user input seems too brief to necessitate multiple complex tool calls.");
      }
    }

    const isValid = errors.length === 0;
    return { isValid, errors };
  }
}