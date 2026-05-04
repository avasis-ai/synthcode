import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GlobalConstraints {
  [key: string]: any;
}

interface ContextGatheringService {
  gatherContext(
    history: Message[],
    currentState: Record<string, any>,
    constraints: GlobalConstraints
  ): {
    enrichedContext: Record<string, any>;
    summary: string;
  };
}

class ContextualToolCallValidatorContextEnricher {
  private contextService: ContextGatheringService;

  constructor(contextService: ContextGatheringService) {
    this.contextService = contextService;
  }

  enrichContext(
    history: Message[],
    currentState: Record<string, any>,
    constraints: GlobalConstraints
  ): {
    enrichedContext: Record<string, any>;
    summary: string;
  } {
    return this.contextService.gatherContext(history, currentState, constraints);
  }
}

class DefaultContextGatheringService implements ContextGatheringService {
  gatherContext(
    history: Message[],
    currentState: Record<string, any>,
    constraints: GlobalConstraints
  ): {
    enrichedContext: Record<string, any>;
    summary: string;
  } {
    const context: Record<string, any> = {
      historySummary: this.summarizeHistory(history),
      currentState: currentState,
      globalConstraints: constraints,
      // Placeholder for derived context like user intent, etc.
      derivedIntent: this.deriveIntent(history, currentState),
    };

    const summary = `Context enriched successfully. History analyzed, state merged, and constraints applied.`;

    return {
      enrichedContext: context,
      summary: summary,
    };
  }

  private summarizeHistory(history: Message[]): string {
    let textSummary = "";
    for (const message of history) {
      if (message.role === "user") {
        textSummary += `User said: ${message.content.map((block: ContentBlock) => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ")}\n`;
      } else if (message.role === "assistant") {
        textSummary += `Assistant responded: ${message.content.map((block: ContentBlock) => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ")}\n`;
      }
    }
    return textSummary.substring(0, Math.min(textSummary.length, 1000)) + (textSummary.length < 1000 ? "..." : "");
  }

  private deriveIntent(history: Message[], currentState: Record<string, any>): Record<string, any> {
    // Simple logic: check if the last user message mentions a specific topic
    const lastUserMessage = history.filter(m => m.role === "user").pop();
    let intent: Record<string, any> = {
      topic: "general",
      urgency: "normal",
    };

    if (lastUserMessage) {
      const content = lastUserMessage.content.map((block: ContentBlock) => {
        if (block.type === "text") return block.text;
        return "";
      }).join(" ");

      if (content.toLowerCase().includes("error") || content.toLowerCase().includes("fail")) {
        intent.urgency = "high";
      } else if (content.toLowerCase().includes("how to")) {
        intent.topic = "instructional";
      }
    }

    return {
      intent: intent,
      contextSource: "history_and_state_analysis",
    };
  }
}

export { ContextualToolCallValidatorContextEnricher, DefaultContextGatheringService };