import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface AgentContext {
  history: Message[];
  state: Record<string, any>;
}

export interface ToolCallRequest {
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface GuardrailResult {
  isValid: boolean;
  reason?: string;
  suggestedAction?: "REDUNDANT" | "CONTEXTUALLY_INVALID" | "OK";
}

export class ContextualToolCallGuardrailV1 {
  private readonly maxHistoryCheckCount: number;

  constructor(maxHistoryCheckCount: number = 3) {
    this.maxHistoryCheckCount = maxHistoryCheckCount;
  }

  validate(context: AgentContext, request: ToolCallRequest): GuardrailResult {
    const history = context.history;

    if (!history || history.length === 0) {
      return { isValid: true };
    }

    // 1. Check for immediate redundancy against recent tool calls in history
    const recentToolCalls = this.extractRecentToolCalls(history);
    if (recentToolCalls.length > 0) {
      for (const previousCall of recentToolCalls) {
        if (this.isRedundant(previousCall, request)) {
          return {
            isValid: false,
            reason: `Tool call to ${request.toolName} with parameters ${JSON.stringify(request.parameters)} appears redundant based on recent history.`,
            suggestedAction: "REDUNDANT",
          };
        }
      }
    }

    // 2. Check for context-based invalidity (Simplified: checking if required state exists)
    if (!this.checkContextualPrerequisites(context, request)) {
      return {
        isValid: false,
        reason: `Contextual check failed. The agent might not have achieved the necessary state for tool '${request.toolName}'.`,
        suggestedAction: "CONTEXTUALLY_INVALID",
      };
    }

    return { isValid: true };
  }

  private extractRecentToolCalls(history: Message[]): { toolName: string; parameters: Record<string, unknown> }[] {
    const calls: { toolName: string; parameters: Record<string, unknown> }[] = [];
    const relevantHistory = history.slice(-this.maxHistoryCheckCount);

    for (const message of relevantHistory) {
      if (message.role === "tool") {
        const toolResultMessage = message as ToolResultMessage;
        // In a real system, we'd need the original ToolUseBlock that generated this result.
        // For this simulation, we assume the context or history structure provides enough info.
        // We'll simulate finding the original request if the result is present.
        // Since we only have ToolResultMessage, we'll skip deep history extraction for simplicity,
        // focusing on the *intent* of the last tool use.
        // A better implementation would track ToolUseBlock directly.
      }
    }

    // Simplified extraction: Look for the last ToolUseBlock in the history content if available.
    // Since Message structure is abstract here, we'll just return a placeholder indicating a check was done.
    // For robustness, we'll assume if the last message was an assistant response containing a tool use, we capture it.
    if (history.length > 0 && history[history.length - 1].role === "assistant") {
        const lastAssistantMessage = history[history.length - 1] as AssistantMessage;
        for (const block of lastAssistantMessage.content) {
            if (block.type === "tool_use" && typeof block === 'object' && 'name' in block && 'input' in block) {
                const toolUseBlock = block as ToolUseBlock;
                calls.push({
                    toolName: toolUseBlock.name,
                    parameters: toolUseBlock.input,
                });
                break;
            }
        }
    }

    return calls;
  }

  private isRedundant(previousCall: { toolName: string; parameters: Record<string, unknown> }, currentRequest: ToolCallRequest): boolean {
    // Check if tool name is identical AND parameters are identical (deep comparison needed for production)
    if (previousCall.toolName !== currentRequest.toolName) {
      return false;
    }

    // Simple JSON string comparison for parameter check
    try {
      const prevParamsString = JSON.stringify(previousCall.parameters);
      const currentParamsString = JSON.stringify(currentRequest.parameters);
      return prevParamsString === currentParamsString;
    } catch (e) {
      return false;
    }
  }

  private checkContextualPrerequisites(context: AgentContext, request: ToolCallRequest): boolean {
    // Example: If the tool requires 'user_id' and the state doesn't have it.
    if (request.toolName === "get_user_profile") {
      if (!context.state["user_id"]) {
        return false;
      }
    }
    // Add more complex state checks here based on tool requirements.
    return true;
  }
}