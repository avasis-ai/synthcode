import { AgentContext, ToolUsageHistory, CapabilityRegistry, Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface EnrichedToolCallContext {
  currentContext: AgentContext;
  history: ToolUsageHistory;
  capabilities: CapabilityRegistry;
  enrichedPayload: {
    reasoning: string;
    requiredCapabilities: string[];
    suggestedToolCalls: {
      toolName: string;
      input: Record<string, unknown>;
      confidenceScore: number;
    }[];
    contextSummary: string;
  };
}

export class StructuredToolCallContextEnricher {
  enrich(
    context: AgentContext,
    history: ToolUsageHistory,
    capabilities: CapabilityRegistry,
    userInput: Message
  ): EnrichedToolCallContext {
    const {
      currentMessages,
      sessionState,
    } = context;

    const {
      recentToolUses,
      historicalPatterns,
    } = history;

    const enrichedPayload = this.analyzeAndEnrich(
      currentMessages,
      userInput,
      recentToolUses,
      historicalPatterns,
      capabilities
    );

    return {
      currentContext: context,
      history: history,
      capabilities: capabilities,
      enrichedPayload: enrichedPayload,
    };
  }

  private analyzeAndEnrich(
    currentMessages: Message[],
    userInput: Message,
    recentToolUses: any[],
    historicalPatterns: any[],
    capabilities: CapabilityRegistry
  ): {
    reasoning: string;
    requiredCapabilities: string[];
    suggestedToolCalls: {
      toolName: string;
      input: Record<string, unknown>;
      confidenceScore: number;
    }[];
    contextSummary: string;
  } {
    const contextSummary = this.generateContextSummary(currentMessages, userInput);
    const requiredCapabilities = this.determineRequiredCapabilities(
      userInput,
      contextSummary,
      capabilities
    );
    const suggestedToolCalls = this.suggestToolCalls(
      userInput,
      recentToolUses,
      historicalPatterns,
      capabilities
    );
    const reasoning = `Enriched context analysis: User intent detected based on "${userInput.content.substring(0, 30)}...". Required capabilities analyzed: ${requiredCapabilities.join(', ')}. Suggested actions derived from history and current state.`;

    return {
      reasoning,
      requiredCapabilities,
      suggestedToolCalls,
      contextSummary,
    };
  }

  private generateContextSummary(
    messages: Message[],
    userInput: Message
  ): string {
    const historyText = messages.map(m => {
      if (m.role === "user") return `User: ${m.content}`;
      if (m.role === "assistant") return `Assistant: ${m.content}`;
      if (m.role === "tool") return `Tool Result: ${m.content}`;
      return "";
    }).join("\n");

    return `[History Summary]\n${historyText}\n\n[Current Input]\n${userInput.content}`;
  }

  private determineRequiredCapabilities(
    userInput: Message,
    contextSummary: string,
    capabilities: CapabilityRegistry
  ): string[] {
    const required: string[] = [];
    if (userInput.content.toLowerCase().includes("search")) {
      required.push("search_engine_access");
    }
    if (contextSummary.includes("database query")) {
      required.push("database_read_write");
    }
    if (capabilities.has("image_generation")) {
      required.push("image_generation");
    }
    return [...new Set(required)];
  }

  private suggestToolCalls(
    userInput: Message,
    recentToolUses: any[],
    historicalPatterns: any[],
    capabilities: CapabilityRegistry
  ): {
    toolName: string;
    input: Record<string, unknown>;
    confidenceScore: number;
  }[] {
    const suggestions: {
      toolName: string;
      input: Record<string, unknown>;
      confidenceScore: number;
    }[] = [];

    // Simple heuristic based on keywords and recent usage
    if (userInput.content.toLowerCase().includes("weather")) {
      suggestions.push({
        toolName: "get_current_weather",
        input: { location: "user_specified_or_default" },
        confidenceScore: 0.95,
      });
    }

    if (historicalPatterns.some((p: any) => p.toolName === "data_fetcher")) {
      suggestions.push({
        toolName: "data_fetcher",
        input: { query: "general_data_request" },
        confidenceScore: 0.75,
      });
    }

    return suggestions;
  }
}