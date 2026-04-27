import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface SemanticContextPrunerOptions {
  similarityThreshold: number;
  embeddingModel: (text: string) => Promise<Float32Array>;
}

export class SemanticContextPruner {
  private readonly options: SemanticContextPrunerOptions;

  constructor(options: SemanticContextPrunerOptions) {
    this.options = options;
  }

  private async calculateSimilarity(
    embeddingA: Float32Array,
    embeddingB: Float32Array
  ): Promise<number> {
    let sumOfProducts = 0;
    for (let i = 0; i < embeddingA.length; i++) {
      sumOfProducts += embeddingA[i] * embeddingB[i];
    }
    const magnitudeA = Math.sqrt(embeddingA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(embeddingB.reduce((acc, val) => acc + val * val, 0));
    return sumOfProducts / (magnitudeA * magnitudeB);
  }

  private async getEmbedding(text: string): Promise<Float32Array> {
    return this.options.embeddingModel(text);
  }

  private async scoreChunk(
    chunk: Message[],
    historyEmbeddings: Map<string, Float32Array>
  ): Promise<{ chunk: Message; score: number }> {
    if (chunk.length === 0) {
      return { chunk: chunk[0] || {} as Message, score: 0 };
    }

    const chunkText = chunk.map(m => m.content.map(block => {
      if (block.type === "text") return block.text;
      if (block.type === "tool_use") return `Tool Use: ${block.name} with input: ${JSON.stringify(block.input)}`;
      if (block.type === "thinking") return `Thinking: ${block.thinking}`;
      return "";
    }).join(" "));

    const chunkEmbedding = await this.getEmbedding(chunkText);
    let maxSimilarity = 0;

    for (const [key, historyEmbedding] of historyEmbeddings.entries()) {
      const similarity = await this.calculateSimilarity(chunkEmbedding, historyEmbedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    return { chunk: chunk[0], score: maxSimilarity };
  }

  public async prune(
    newChunk: Message,
    history: Message[]
  ): Promise<{ filteredChunk: Message | null; isRedundant: boolean }> {
    if (history.length === 0) {
      return { filteredChunk: newChunk, isRedundant: false };
    }

    const historyEmbeddings = new Map<string, Float32Array>();
    for (let i = 0; i < history.length; i++) {
      const historyChunk = history[i];
      const historyText = historyChunk.content.map(block => {
        if (block.type === "text") return block.text;
        if (block.type === "tool_use") return `Tool Use: ${block.name} with input: ${JSON.stringify(block.input)}`;
        if (block.type === "thinking") return `Thinking: ${block.thinking}`;
        return "";
      }).join(" ");
      historyEmbeddings.set(String(i), historyText);
    }

    const { score } = await this.scoreChunk([newChunk], historyEmbeddings);

    const isRedundant = score >= this.options.similarityThreshold;

    if (isRedundant) {
      return { filteredChunk: null, isRedundant: true };
    } else {
      return { filteredChunk: newChunk, isRedundant: false };
    }
  }
}