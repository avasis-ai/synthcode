import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface IntentContext {
  primaryIntent: string;
  keywords: string[];
}

interface HistoryContext {
  recentInteractions: Message[];
  summary: string;
}

interface ToolCallContext {
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface EnrichedContext {
  baseMessage: Message;
  intent: IntentContext;
  history: HistoryContext;
  toolCall: ToolCallContext;
  combinedContext: string;
}

class ContextEnricher {
  constructor(
    private readonly contextualizer: (message: Message) => Promise<IntentContext>,
    private readonly historyStore: { getHistory: (message: Message) => Promise<HistoryContext> }
  ) {}

  public async enrich(
    baseMessage: Message,
    toolCallContext: ToolCallContext
  ): Promise<EnrichedContext> {
    const intentPromise = this.contextualizer(baseMessage);
    const historyPromise = this.historyStore.getHistory(baseMessage);

    const [intent, history] = await Promise.all([
      intentPromise,
      historyPromise,
    ]);

    const combinedContext = this.generateCombinedContext(
      baseMessage,
      intent,
      history,
      toolCallContext
    );

    return {
      baseMessage,
      intent,
      history,
      toolCall: toolCallContext,
      combinedContext,
    };
  }

  private generateCombinedContext(
    baseMessage: Message,
    intent: IntentContext,
    history: HistoryContext,
    toolCallContext: ToolCallContext
  ): string {
    let context = `--- Base Message ---\nRole: ${baseMessage.role}\nContent: ${JSON.stringify(baseMessage.content)}\n\n`;
    context += `--- Intent Context ---\nPrimary Intent: ${intent.primaryIntent}\nKeywords: ${intent.keywords.join(', ')}\n\n`;
    context += `--- History Context ---\nSummary: ${history.summary}\nRecent Interactions Count: ${history.recentInteractions.length}\n\n`;
    context += `--- Tool Call Context ---\nTool Name: ${toolCallContext.toolName}\nParameters: ${JSON.stringify(toolCallContext.parameters)}\n`;
    return context;
  }
}

export { ContextEnricher };