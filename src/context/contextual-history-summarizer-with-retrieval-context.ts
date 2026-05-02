import { Message, ContentBlock, TextBlock } from "./types";

export interface ContextChunk {
  text: string;
  source: string;
}

export interface ContextualHistorySummarizer {
  summarizeHistoryWithRetrievalContext(
    history: Message[],
    retrievedContextChunks: ContextChunk[] | undefined
  ): Promise<string>;
}

export class ContextualHistorySummarizerWithRetrievalContext implements ContextualHistorySummarizer {
  private readonly llmService: {
    generateContent: (prompt: string): Promise<string>;
  };

  constructor(llmService: {
    generateContent: (prompt: string): Promise<string>;
  }) {
    this.llmService = llmService;
  }

  private formatHistory(history: Message[]): string {
    let formatted = "";
    for (const message of history) {
      if (message.role === "user") {
        formatted += `User: ${message.content.map((block) => {
          if (block.type === "text") return block.text;
          return "";
        }).join("")}\n`;
      } else if (message.role === "assistant") {
        formatted += `Assistant: ${message.content.map((block) => {
          if (block.type === "text") return block.text;
          return "";
        }).join("")}\n`;
      } else if (message.role === "tool") {
        formatted += `Tool Result (${message.tool_use_id}): ${message.content}\n`;
      }
    }
    return formatted.trim();
  }

  private formatRetrievedContext(chunks: ContextChunk[]): string {
    if (!chunks || chunks.length === 0) {
      return "";
    }
    let context = "--- RETRIEVED CONTEXT ---\n";
    context += "The following context was retrieved from the knowledge base. Please ensure your summary is grounded in this information:\n";
    chunks.forEach((chunk, index) => {
      context += `[Source: ${chunk.source}]\n${chunk.text}\n---\n`;
    });
    context += "-----------------------\n";
    return context;
  }

  async summarizeHistoryWithRetrievalContext(
    history: Message[],
    retrievedContextChunks: ContextChunk[] | undefined
  ): Promise<string> {
    const historyString = this.formatHistory(history);
    const contextString = this.formatRetrievedContext(retrievedContextChunks);

    const systemInstruction = `You are an expert summarization assistant. Your goal is to summarize the conversation history, ensuring that the summary is highly accurate and directly supported by the provided context. If the context provides specific details, you MUST incorporate them. If the context contradicts the history, prioritize the context.`;

    const prompt = `
${contextString}
\n\n--- CONVERSATION HISTORY ---\n${historyString}
\n\nBased on the history and prioritizing the retrieved context, please provide a concise, comprehensive summary of the conversation so far. Focus on key decisions, outstanding questions, and main topics discussed.
`;

    const summary = await this.llmService.generateContent(prompt);
    return summary;
  }
}

export { ContextualHistorySummarizerWithRetrievalContext };