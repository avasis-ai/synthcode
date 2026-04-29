import { ValidatorBase } from "./validator-base";
import { Message, ToolUseBlock } from "../types";

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  // Add other necessary fields for dependency checking
}

interface ToolCallContext {
  toolName: string;
  toolUseId: string;
  input: Record<string, unknown>;
}

export class StructuredToolCallValidatorV130 extends ValidatorBase {
  constructor(private toolDefinitions: Map<string, ToolDefinition>) {
    super();
  }

  validate(messages: Message[]): { isValid: boolean; errors: string[] } {
    const toolCalls: ToolUseBlock[] = [];
    const toolUseIds: Set<string> = new Set<string>();
    const callSequence: ToolCallContext[] = [];

    for (const message of messages) {
      if (message.role === "assistant") {
        const assistantMessage = message as { role: "assistant", content: ContentBlock[] };
        for (const block of assistantMessage.content) {
          if (block.type === "tool_use") {
            const toolUseBlock = block as ToolUseBlock;
            toolCalls.push(toolUseBlock);
            toolUseIds.add(toolUseBlock.id);
          }
        }
      }
    }

    if (toolCalls.length === 0) {
      return { isValid: true, errors: [] };
    }

    // 1. Build the sequence and map context
    for (const block of toolCalls) {
      const toolName = block.name;
      const toolUseId = block.id;
      const input = block.input;

      if (!this.toolDefinitions.has(toolName)) {
        return { isValid: false, errors: [`Unknown tool name: ${toolName}`] };
      }

      callSequence.push({
        toolName: toolName,
        toolUseId: toolUseId,
        input: input,
      });
    }

    const errors: string[] = [];

    // 2. Dependency Graph Check (Simplified for this implementation)
    // In a real scenario, this would involve complex graph traversal.
    // Here, we check for explicit dependency markers or required predecessors.
    for (let i = 0; i < callSequence.length; i++) {
      const currentCall = callSequence[i];
      const previousCall = i > 0 ? callSequence[i - 1] : null;

      // Example Dependency Rule: If Tool B requires output from Tool A, 
      // Tool A must have been called immediately before Tool B.
      // We simulate this by checking if the current tool requires a specific predecessor.
      const requiredPredecessor = this.getRequiredPredecessor(currentCall.toolName);

      if (requiredPredecessor && previousCall) {
        if (previousCall.toolName !== requiredPredecessor) {
          errors.push(
            `Tool call sequence error: ${currentCall.toolName} requires ${requiredPredecessor} to run immediately before.`
          );
        }
      }
    }

    // 3. Consistency Check (e.g., ensuring inputs match definitions)
    for (const call of callSequence) {
      const definition = this.toolDefinitions.get(call.toolName)!;
      // Basic check: ensure all required parameters are present in the call input
      for (const paramName in definition.parameters) {
        if (definition.parameters[paramName] && typeof (definition.parameters[paramName] as any).required === 'boolean' && (definition.parameters[paramName] as any).required && !(paramName in call.input)) {
          errors.push(`Missing required parameter '${paramName}' for tool '${call.toolName}'.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  private getRequiredPredecessor(toolName: string): string | null {
    // Mock implementation: Assume 'get_user_data' must follow 'authenticate_user'
    if (toolName === "get_user_data") {
      return "authenticate_user";
    }
    return null;
  }
}