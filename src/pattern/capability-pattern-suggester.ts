import {
  Message,
  ToolUseBlock,
  ContentBlock,
  TextBlock,
  AssistantMessage,
  UserMessage,
  ToolResultMessage,
} from "./types";

export type Suggestion = {
  capabilityName: string;
  confidenceScore: number;
};

export class CapabilityPatternSuggester {
  private transitionCounts: Map<string, Map<string, number>>;

  constructor() {
    this.transitionCounts = new Map();
  }

  private extractCapabilityName(block: ContentBlock): string | null {
    if (block.type === "tool_use") {
      return block.name;
    }
    return null;
  }

  private extractCapabilityFromMessage(message: Message): string | null {
    if ("tool_use_id" in message && message.role === "tool") {
      // Assuming tool result messages might implicitly relate to a tool,
      // but for prediction, we focus on the *use* of the tool.
      // We'll rely on the explicit ToolUseBlock extraction for robustness.
      return null;
    }

    if ("content" in message && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (typeof block === "object" && "type" in block && block.type === "tool_use") {
          return block.name;
        }
      }
    }
    return null;
  }

  train(history: Message[]): void {
    let currentCapability: string | null = null;

    for (const message of history) {
      const nextCapability = this.extractCapabilityFromMessage(message);

      if (nextCapability) {
        if (currentCapability) {
          this.recordTransition(currentCapability, nextCapability);
        }
        currentCapability = nextCapability;
      } else {
        currentCapability = null;
      }
    }
  }

  private recordTransition(from: string, to: string): void {
    if (!this.transitionCounts.has(from)) {
      this.transitionCounts.set(from, new Map());
    }

    const transitions = this.transitionCounts.get(from)!;
    const currentCount = transitions.get(to) || 0;
    transitions.set(to, currentCount + 1);
  }

  suggest(lastCapability: string, topK: number = 3): Suggestion[] {
    if (!this.transitionCounts.has(lastCapability)) {
      return [];
    }

    const transitions = this.transitionCounts.get(lastCapability)!;
    const suggestionsMap = new Map<string, number>();

    for (const [target, count] of transitions.entries()) {
      suggestionsMap.set(target, count);
    }

    const sortedSuggestions = Array.from(suggestionsMap.entries())
      .map(([capabilityName, count]) => ({
        capabilityName,
        confidenceScore: count,
      }))
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    return sortedSuggestions.slice(0, topK);
  }
}