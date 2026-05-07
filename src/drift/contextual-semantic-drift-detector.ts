import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type Vector = number[];

interface SemanticDriftReport {
  isDrifting: boolean;
  distance: number;
  threshold: number;
  contextChunk: string;
  message: string;
}

export class ContextualSemanticDriftDetector {
  private intentVector: Vector | null = null;
  private driftThreshold: number;

  constructor(driftThreshold: number = 0.7) {
    this.driftThreshold = driftThreshold;
  }

  private async calculateEmbedding(text: string): Promise<Vector> {
    // MOCK IMPLEMENTATION: In a real scenario, this would call an embedding API (e.g., OpenAI, Cohere).
    // For demonstration, we return a mock vector based on the input length/hash.
    const seed = text.length % 10;
    return Array(5).fill(0).map((_, i) => (seed + i) / 100.0);
  }

  private calculateCosineDistance(vecA: Vector, vecB: Vector): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same dimension.");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    const magnitudeProduct = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    if (magnitudeProduct === 0) return 1.0; // Max distance if zero vector
    
    // Cosine Similarity = dotProduct / (magnitudeA * magnitudeB)
    // Cosine Distance = 1 - Cosine Similarity
    const similarity = dotProduct / magnitudeProduct;
    return 1.0 - similarity;
  }

  public async initialize(initialPrompt: string, domainContext: string): Promise<void> {
    const combinedContext = `${initialPrompt} | Domain Context: ${domainContext}`;
    this.intentVector = await this.calculateEmbedding(combinedContext);
  }

  private extractTextFromMessage(message: Message): string {
    if ("user" === message.role) {
      return message.content;
    }
    if ("tool" === message.role) {
      return `Tool Result for ${message.tool_use_id}: ${message.content}`;
    }
    if ("assistant" === message.role) {
      return message.content.map(block => {
        if (block.type === "text") return block.text;
        if (block.type === "thinking") return `[THINKING]: ${block.thinking}`;
        return "";
      }).join(" ");
    }
    return "";
  }

  public async monitorContext(message: Message): Promise<SemanticDriftReport> {
    if (!this.intentVector) {
      throw new Error("Detector must be initialized before monitoring context.");
    }

    const contextChunk = this.extractTextFromMessage(message);
    if (!contextChunk) {
      return { isDrifting: false, distance: 0, threshold: this.driftThreshold, contextChunk: "", message: "No meaningful text content detected." };
    }

    const currentVector = await this.calculateEmbedding(contextChunk);
    const distance = this.calculateCosineDistance(this.intentVector, currentVector);

    const isDrifting = distance > this.driftThreshold;
    const report: SemanticDriftReport = {
      isDrifting: isDrifting,
      distance: parseFloat(distance.toFixed(4)),
      threshold: this.driftThreshold,
      contextChunk: contextChunk,
      message: isDrifting
        ? `Semantic drift detected. Distance (${distance.toFixed(4)}) exceeds threshold (${this.driftThreshold}). Consider refining the goal.`
        : "Context remains semantically coherent with the initial intent."
    };

    return report;
  }
}