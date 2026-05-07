import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export class AttentionWeightManager {
  private contextStore: Map<string, { chunk: Message; weight: number }>;

  constructor() {
    this.contextStore = new Map<string, { chunk: Message; weight: number }>();
  }

  /**
   * Adds a new context chunk with a default initial weight.
   * @param chunk The context message chunk.
   * @param chunkId A unique identifier for the chunk.
   * @param initialWeight The starting weight (defaults to 1.0).
   */
  addContext(chunk: Message, chunkId: string, initialWeight: number = 1.0): void {
    if (this.contextStore.has(chunkId)) {
      console.warn(`Context chunk ID ${chunkId} already exists. Use boostWeight instead.`);
      return;
    }
    this.contextStore.set(chunkId, { chunk, weight: initialWeight });
  }

  /**
   * Boosts the attention weight of a specific context chunk.
   * This simulates high utility or successful retrieval.
   * @param chunkId The unique identifier of the chunk to boost.
   * @param weightIncrease The amount by which to increase the weight.
   */
  boostWeight(chunkId: string, weightIncrease: number): boolean {
    const entry = this.contextStore.get(chunkId);
    if (!entry) {
      return false;
    }
    const newWeight = entry.weight + weightIncrease;
    this.contextStore.set(chunkId, {
      chunk: entry.chunk,
      weight: newWeight,
    });
    return true;
  }

  /**
   * Applies exponential decay to all stored weights, simulating loss of attention over time.
   * @param timeDelta The elapsed time since the last check (e.g., seconds).
   * @param decayRate The rate of decay (e.g., 0.1 per second).
   */
  decayWeights(timeDelta: number, decayRate: number): void {
    if (timeDelta < 0 || decayRate < 0) return;

    const decayFactor = Math.exp(-decayRate * timeDelta);

    for (const [id, entry] of this.contextStore.entries()) {
      const newWeight = entry.weight * decayFactor;
      this.contextStore.set(id, {
        chunk: entry.chunk,
        weight: newWeight,
      });
    }
  }

  /**
   * Retrieves all stored context chunks sorted by their current attention weight (highest first).
   * @returns An array of { chunk, weight } tuples.
   */
  getWeightedContext(): Array<{ chunk: Message; weight: number }> {
    const contextArray = Array.from(this.contextStore.entries()).map(([id, entry]) => ({
      chunk: entry.chunk,
      weight: entry.weight,
    }));

    // Sort by weight descending
    return contextArray.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Clears the entire context store.
   */
  clearContext(): void {
    this.contextStore.clear();
  }
}