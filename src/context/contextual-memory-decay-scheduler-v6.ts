import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ContextType = "user" | "assistant" | "tool";

type DecayCurve = (ageSeconds: number) => number;

export interface DecayRule {
  [contextType: string]: {
    curve: DecayCurve;
    initialWeight: number;
  };
}

interface ContextEntry {
  message: Message;
  timestamp: number;
  type: ContextType;
  weight: number;
}

export class ContextualMemoryDecaySchedulerV6 {
  private contextStore: Map<string, ContextEntry>;
  private decayRules: DecayRule;

  constructor(initialRules: DecayRule) {
    this.contextStore = new Map<string, ContextEntry>();
    this.decayRules = initialRules;
  }

  public addContextEntry(message: Message, timestamp: number): void {
    let type: ContextType;
    if (message.role === "user") {
      type = "user";
    } else if (message.role === "assistant") {
      type = "assistant";
    } else {
      type = "tool";
    }

    const entry: ContextEntry = {
      message: message,
      timestamp: timestamp,
      type: type,
      weight: 1.0, // Initial weight before decay calculation
    };
    this.contextStore.set(Date.now().toString() + Math.random().toString(36).substring(2, 9), entry);
  }

  public setDecayRules(newRules: DecayRule): void {
    this.decayRules = newRules;
  }

  private calculateDecay(entry: ContextEntry): number {
    const rule = this.decayRules[entry.type];
    if (!rule) {
      return 0.0;
    }
    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    const decayFactor = rule.curve(ageSeconds);
    return rule.initialWeight * decayFactor;
  }

  public decayContext(): void {
    const now = Date.now();
    for (const [key, entry] of this.contextStore.entries()) {
      const decayedWeight = this.calculateDecay(entry);
      // In a real system, we would update the weight in the store.
      // For this simulation, we just log/return the decayed value.
      // We simulate updating the entry's weight for demonstration.
      const updatedEntry: ContextEntry = {
        ...entry,
        weight: decayedWeight,
      };
      this.contextStore.set(key, updatedEntry);
    }
  }

  public getContextWeights(): Map<string, number> {
    const weights = new Map<string, number>();
    for (const entry of this.contextStore.values()) {
      weights.set(entry.message.role + ":" + entry.message.content.substring(0, 10), entry.weight);
    }
    return weights;
  }
}