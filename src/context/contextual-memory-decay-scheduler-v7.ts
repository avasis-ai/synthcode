import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextMetadata {
  relevanceScore: number;
  sourceType: "user" | "assistant" | "tool";
}

export interface ContextualDecayRule {
  /**
   * Calculates the decay factor based on elapsed time and context metadata.
   * @param timeElapsedSeconds The time elapsed since the memory chunk was created/last accessed.
   * @param metadata Contextual metadata associated with the memory chunk.
   * @returns A decay factor (0.0 to 1.0), where 1.0 means no decay and 0.0 means fully decayed.
   */
  calculateDecayFactor(timeElapsedSeconds: number, metadata: ContextMetadata): number;
}

export class ContextualMemoryDecaySchedulerV7 implements ContextualDecayRule {
  private readonly baseDecayRate: number;
  private readonly relevanceWeight: number;

  constructor(baseDecayRate: number = 0.01, relevanceWeight: number = 0.3) {
    this.baseDecayRate = baseDecayRate;
    this.relevanceWeight = relevanceWeight;
  }

  calculateDecayFactor(timeElapsedSeconds: number, metadata: ContextMetadata): number {
    const timeDecay = Math.min(1.0, timeElapsedSeconds * this.baseDecayRate);

    // Normalize relevance score (assuming relevanceScore is between 0.0 and 1.0)
    const relevanceFactor = metadata.relevanceScore;

    // Weighted average decay calculation:
    // Decay = (Time Decay * (1 - Weight)) + (1 - Relevance * Weight)
    // A higher relevance score should *reduce* the decay.
    // We model the decay as: Decay = TimeDecay * (1 - RelevanceFactor * Weight)
    
    const decayModifier = 1.0 - (relevanceFactor * this.relevanceWeight);
    
    let finalDecay = timeDecay * decayModifier;

    // Ensure decay is between 0 and 1
    return Math.max(0.0, Math.min(1.0, finalDecay));
  }

  /**
   * Calculates the effective decay factor for a list of memories.
   * @param memories An array of objects containing the memory, its timestamp, and metadata.
   * @param currentTime The current time in seconds.
   * @returns An array of decay factors corresponding to the input memories.
   */
  public calculateDecayForMemories(
    memories: { memory: Message; timestamp: number; metadata: ContextMetadata }[],
    currentTime: number
  ): number[] {
    return memories.map(memoryData => {
      const timeElapsed = (currentTime - memoryData.timestamp) / 1000; // Assuming timestamp is in ms
      return this.calculateDecayFactor(timeElapsed, memoryData.metadata);
    });
  }
}