import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type Embedding = Float64Array;

export class IntentTrajectoryValidator {
  private initialIntentEmbedding: Embedding;
  private driftThreshold: number;

  constructor(initialIntentEmbedding: Embedding, driftThreshold: number = 0.7) {
    this.initialIntentEmbedding = initialIntentEmbedding;
    this.driftThreshold = driftThreshold;
  }

  private calculateContextEmbedding(messages: Message[]): Embedding {
    // Placeholder implementation for embedding extraction.
    // In a real scenario, this would call an ML model (e.g., OpenAI embeddings API).
    // We simulate generating an embedding based on the input length/complexity.
    const totalContentLength = messages.reduce((acc, msg) => {
      let length = 0;
      if (msg.role === "user" && msg.content) {
        length += msg.content.length;
      } else if (msg.role === "tool" && msg.content) {
        length += msg.content.length;
      }
      return acc + length;
    }, 0);

    // Simulate a fixed-size embedding (e.g., 768 dimensions)
    const embeddingSize = 768;
    const contextEmbedding = new Float64Array(embeddingSize);

    // Simple deterministic simulation: the embedding shifts slightly based on content length
    for (let i = 0; i < embeddingSize; i++) {
      contextEmbedding[i] = (totalContentLength + i) / 1000.0;
    }
    return contextEmbedding;
  }

  private calculateCosineDistance(embeddingA: Embedding, embeddingB: Embedding): number {
    // Placeholder implementation for Cosine Distance calculation.
    // Distance = sqrt(1 - CosineSimilarity)
    
    // Since we are simulating, we will calculate a deterministic "distance"
    // based on the difference between the two simulated embeddings.
    let sumOfSquares = 0;
    for (let i = 0; i < embeddingA.length; i++) {
      const diff = embeddingA[i] - embeddingB[i];
      sumOfSquares += diff * diff;
    }
    
    // Normalize the simulated distance to be between 0 and 1.
    // A larger difference means higher drift (closer to 1).
    return Math.min(1.0, Math.sqrt(sumOfSquares) / 10.0);
  }

  /**
   * Validates the current conversation context against the initial intent embedding.
   * @param currentContextMessages The sequence of messages leading up to the current state.
   * @returns { { isValid: boolean, driftScore: number, suggestion: string | null } }
   */
  public validate(currentContextMessages: Message[]): { isValid: boolean, driftScore: number, suggestion: string | null } {
    if (currentContextMessages.length === 0) {
      return { isValid: true, driftScore: 0, suggestion: null };
    }

    const currentEmbedding = this.calculateContextEmbedding(currentContextMessages);
    const driftScore = this.calculateCosineDistance(currentEmbedding, this.initialIntentEmbedding);

    if (driftScore > this.driftThreshold) {
      return {
        isValid: false,
        driftScore: driftScore,
        suggestion: "The current conversation trajectory suggests a significant shift in goal. Please clarify your updated objective.",
      };
    }

    return {
      isValid: true,
      driftScore: driftScore,
      suggestion: null,
    };
  }
}