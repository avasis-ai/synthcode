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

interface AggregatorContext {
  goal: string;
  currentContext: string;
}

interface ContextualToolCallHistoryAggregator {
  aggregateHistory(
    history: Message[],
    context: AggregatorContext
  ): string;
}

export class ContextualToolCallHistoryAggregator implements ContextualToolCallHistoryAggregator {
  aggregateHistory(
    history: Message[],
    context: AggregatorContext
  ): string {
    const relevantToolCalls: {
      message: Message;
      summary: string;
    }[] = [];

    for (const message of history) {
      if (message.role === "tool" && message as ToolResultMessage).tool_use_id) {
        const toolMessage = message as ToolResultMessage;
        const summary = this.summarizeToolCall(
          toolMessage,
          context.goal,
          context.currentContext
        );
        relevantToolCalls.push({
          message: message,
          summary: summary,
        });
      }
    }

    if (relevantToolCalls.length === 0) {
      return "";
    }

    const summaryParts: string[] = [];
    for (const item of relevantToolCalls) {
      summaryParts.push(item.summary);
    }

    return summaryParts.join("\n\n---\n\n");
  }

  private summarizeToolCall(
    toolMessage: ToolResultMessage,
    goal: string,
    context: string
  ): string {
    const isError = toolMessage.is_error && toolMessage.content.includes("error");
    const outcome = toolMessage.content.trim();

    if (isError) {
      return `[ERROR] Tool execution failed for ID ${toolMessage.tool_use_id}. Details: ${outcome.substring(0, 100)}...`;
    }

    let summary = `Tool Result (ID: ${toolMessage.tool_use_id}): `;

    if (outcome.length > 200) {
      summary += `Successfully executed. Outcome summary: ${outcome.substring(0, 200)}...`;
    } else {
      summary += `Outcome: ${outcome}`;
    }

    if (goal.toLowerCase().includes("list") && outcome.toLowerCase().includes("list")) {
      summary += ` (Relevant to goal: Listing items.)`;
    } else if (context.toLowerCase().includes("user profile") && outcome.toLowerCase().includes("user")) {
      summary += ` (Relevant to goal: User profile data retrieved.)`;
    }

    return summary;
  }
}