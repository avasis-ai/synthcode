import { performance } from "node:perf_hooks";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface ContextEntry {
  message: Message;
  timestamp: number;
  decay_rate: number;
}

export class ContextualMemoryRetriever {
  private memory: ContextEntry[] = [];

  constructor(initialMemory: ContextEntry[] = []) {
    this.memory = initialMemory;
  }

  private calculateDecayScore(entry: ContextEntry): number {
    const now = performance.now();
    const timeElapsed = now - entry.timestamp;
    // Decay formula: Score = e^(-decay_rate * time_elapsed)
    // Using Math.exp for e^x
    return Math.exp(-entry.decay_rate * timeElapsed);
  }

  private calculateRelevanceScore(entry: ContextEntry, query: string): number {
    // Placeholder for actual semantic similarity calculation (e.g., embedding distance)
    // For this implementation, we simulate relevance based on content length and a base score.
    let contentText: string = "";
    if (entry.message.role === "user") {
      contentText = entry.message.content;
    } else if (entry.message.role === "assistant") {
      contentText = entry.message.content.map(block => {
        if (block.type === "text") return block.text;
        return "";
      }).join(" ");
    } else if (entry.message.role === "tool") {
      contentText = entry.message.content;
    }
    
    const baseRelevance = Math.min(1.0, contentText.length / 100.0); // Max base relevance of 1.0
    return baseRelevance;
  }

  public addContext(message: Message, decayRate: number = 0.001): void {
    const newEntry: ContextEntry = {
      message: message,
      timestamp: performance.now(),
      decay_rate: decayRate,
    };
    this.memory.push(newEntry);
  }

  public retrieve(query: string, topK: number = 3): { entry: ContextEntry; score: number }[] {
    const scoredMemories: { entry: ContextEntry; score: number }[] = this.memory.map(entry => {
      const relevance = this.calculateRelevanceScore(entry, query);
      const decay = this.calculateDecayScore(entry);
      // Combined Score: Relevance * Decay Factor
      const finalScore = relevance * decay;
      return { entry: entry, score: finalScore };
    });

    scoredMemories.sort((a, b) => b.score - a.score);

    return scoredMemories.slice(0, topK);
  }

  public getMemoryCount(): number {
    return this.memory.length;
  }
}