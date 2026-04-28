import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface VectorStore {
  getEmbeddings(text: string): Promise<Float32Array>;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

export class SemanticContextGraphBuilder {
  private readonly similarityThreshold: number;

  constructor(similarityThreshold: number = 0.7) {
    this.similarityThreshold = similarityThreshold;
  }

  private async calculateSimilarity(
    text1: string,
    text2: string,
    vectorStore: VectorStore
  ): Promise<number> {
    const embeddings1 = await vectorStore.getEmbeddings(text1);
    const embeddings2 = await vectorStore.getEmbeddings(text2);

    let dotProduct = 0;
    for (let i = 0; i < embeddings1.length; i++) {
      dotProduct += embeddings1[i] * embeddings2[i];
    }

    const magnitude1 = Math.sqrt(embeddings1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embeddings2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  private extractTextFromMessage(message: Message): string {
    if ("content" in message) {
      const contentBlocks = (message as any).content || [];
      let text = "";
      for (const block of contentBlocks) {
        if (block.type === "text" && "text" in block) {
          text += block.text;
        }
      }
      return text.trim();
    }
    return "";
  }

  public async buildGraph(
    messages: Message[],
    vectorStore: VectorStore
  ): Promise<{ nodes: { id: string; text: string }[]; edges: GraphEdge[] }> {
    const chunks: { id: string; text: string }[] = [];
    const chunkMap = new Map<string, { id: string; text: string }>();

    messages.forEach((message, index) => {
      const text = this.extractTextFromMessage(message);
      if (text) {
        const id = `${message.role}-${index}`;
        chunks.push({ id, text });
        chunkMap.set(id, { id, text });
      }
    });

    const nodes: { id: string; text: string }[] = chunks;
    const edges: GraphEdge[] = [];

    const promises: Promise<GraphEdge[]>[] = [];

    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const chunkA = chunks[i];
        const chunkB = chunks[j];

        const similarity = await this.calculateSimilarity(
          chunkA.text,
          chunkB.text,
          vectorStore
        );

        if (similarity >= this.similarityThreshold) {
          edges.push({
            sourceId: chunkA.id,
            targetId: chunkB.id,
            weight: similarity,
          });
          // Assuming undirected graph representation for simplicity in this context
          edges.push({
            sourceId: chunkB.id,
            targetId: chunkA.id,
            weight: similarity,
          });
        }
      }
    }

    return { nodes, edges };
  }
}