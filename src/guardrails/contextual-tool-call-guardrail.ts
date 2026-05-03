import {
  Message,
  ToolUseBlock,
  ContentBlock,
} from "./types";

interface AgentContext {
  history: Message[];
  state: Record<string, unknown>;
}

interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export class ContextualToolCallGuardrail {
  constructor(private readonly toolDefinitions: Record<string, any>) {}

  validate(context: AgentContext, toolCall: ToolCall): { isValid: boolean; reason: string } {
    if (!this.isValidCall(context, toolCall)) {
      return { isValid: false, reason: "Contextual validation failed." };
    }
    if (!this.isStateSufficient(context, toolCall)) {
      return { isValid: false, reason: "Context state is insufficient for this tool call." };
    }
    if (this.isRedundant(context, toolCall)) {
      return { isValid: false, reason: "Tool call appears redundant based on recent history." };
    }
    return { isValid: true, reason: "Tool call is valid." };
  }

  private isValidCall(context: AgentContext, toolCall: ToolCall): boolean {
    // Basic schema check (simplified for this example)
    const definition = this.toolDefinitions[toolCall.name];
    if (!definition) {
      return false;
    }
    // In a real scenario, deep schema validation would occur here.
    // For now, we assume the structure matches if the name exists.
    return true;
  }

  private isStateSufficient(context: AgentContext, toolCall: ToolCall): boolean {
    const definition = this.toolDefinitions[toolCall.name];
    if (!definition || !definition.parameters) {
      return true;
    }

    const requiredParams = Object.keys(definition.parameters.required || {});

    for (const param of requiredParams) {
      const expectedType = definition.parameters.properties[param]?.type;
      const providedValue = toolCall.input[param];

      if (providedValue === undefined) {
        return false;
      }

      // Check if the context state *should* have provided this, but didn't.
      // This is a heuristic check: if the tool requires 'user_id' and the context state
      // doesn't contain it, it might be an issue.
      if (param === "user_id" && typeof context.state.userId === "undefined") {
        return false;
      }
    }
    return true;
  }

  private isRedundant(context: AgentContext, toolCall: ToolCall): boolean {
    const historyMessages = context.history.filter(
      (msg) => msg.role === "tool" && (msg as any).tool_use_id
    );

    const lastToolCall = historyMessages[historyMessages.length - 1] as ToolResultMessage;

    if (!lastToolCall) {
      return false;
    }

    // Simple check: If the last tool call was for the same tool and input, it's redundant.
    const lastToolUseBlock = (context.history.flatMap(m => (m as any).content || [])).find(
      (block) => block.type === "tool_use"
    ) as ToolUseBlock | undefined;

    if (lastToolUseBlock && lastToolUseBlock.name === toolCall.name) {
      // Further check on input similarity would be needed here.
      return true;
    }
    return false;
  }
}