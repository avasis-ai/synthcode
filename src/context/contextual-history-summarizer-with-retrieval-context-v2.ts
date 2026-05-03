import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface RetrievalContext {
  context: string;
  relevanceScore: number;
}

export class ContextualHistorySummarizer {
  private readonly historyChunkSize: number;
  private readonly retrievalWeight: number;

  constructor(historyChunkSize: number = 1000, retrievalWeight: number = 0.3) {
    this.historyChunkSize = historyChunkSize;
    this.retrievalWeight = retrievalWeight;
  }

  private chunkHistory(messages: Message[]): string[] {
    const allText = messages.map(msg => {
      if (msg.role === "user") {
        return msg.content.map(block => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");
      } else if (msg.role === "assistant") {
        return msg.content.map(block => {
          if (block.type === "text") return block.text;
          return "";
        }).join(" ");
      } else if (msg.role === "tool") {
        return `${msg.content} (Tool Result)`;
      }
      return "";
    }).join("\n---\n");

    const chunks: string[] = [];
    for (let i = 0; i < allText.length; i += this.historyChunkSize) {
      chunks.push(allText.substring(i, Math.min(i + this.historyChunkSize, allText.length)));
    }
    return chunks;
  }

  private calculateWeightedContext(
    historyChunks: string[],
    retrievalContext?: RetrievalContext
  ): string {
    let weightedContext = "";

    const historyContribution = historyChunks.map((chunk, index) => {
      // Simple scoring: longer chunks contribute more, but we normalize this.
      const score = chunk.length / this.historyChunkSize;
      return `[History Chunk ${index} - Score: ${score.toFixed(2)}]: ${chunk}`;
    }).join("\n---\n");

    if (!retrievalContext) {
      return historyContribution;
    }

    // Combine history and retrieval context with weighting logic
    const retrievalContribution = `[Retrieved Context - Score: ${retrievalContext.relevanceScore.toFixed(2)}]: ${retrievalContext.context}`;

    // Simple combination: history gets (1-W) weight, retrieval gets W weight.
    // In a real LLM prompt, this would be more complex, but here we simulate biasing.
    const combined = `--- HISTORY CONTEXT ---\n${historyContribution}\n\n--- RETRIEVAL FOCUS CONTEXT ---\n${retrievalContribution}`;

    return `${(1 - this.retrievalWeight) * historyContribution}\n\n${this.retrievalWeight * retrievalContribution}\n\n--- COMBINED FOR SUMMARIZATION --- \n${combined}`;
  }

  summarize(
    messages: Message[],
    retrievalContext?: RetrievalContext
  ): string {
    const historyChunks = this.chunkHistory(messages);
    const weightedContext = this.calculateWeightedContext(historyChunks, retrievalContext);

    // In a real implementation, this string would be passed to an LLM API call.
    // For this exercise, we simulate the summarization by prepending the context.
    const prompt = `Summarize the following conversation history, paying special attention to the context provided below. The summary must be concise and highly relevant to the retrieved focus area.\n\n${weightedContext}\n\n--- END OF CONTEXT ---\n\nSUMMARY:`;

    return prompt;
  }
}