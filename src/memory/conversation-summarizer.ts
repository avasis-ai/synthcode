import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface SummarizationOptions {
  maxLength?: number;
  style?: "concise" | "detailed" | "action_items";
}

abstract class LLMAdapter {
  abstract summarize(
    history: Message[],
    options: SummarizationOptions,
    systemPrompt: string
  ): Promise<string>;
}

class ConversationSummarizer {
  private llmAdapter: LLMAdapter;

  constructor(llmAdapter: LLMAdapter) {
    this.llmAdapter = llmAdapter;
  }

  private buildSystemPrompt(options: SummarizationOptions): string {
    let prompt = "You are an expert conversation summarization AI. Your task is to condense the following chat history into a concise, context-aware summary. ";

    if (options.style === "concise") {
      prompt += "The summary must be extremely brief, capturing only the core topic and final outcome. Keep it under 100 words.";
    } else if (options.style === "detailed") {
      prompt += "The summary should be detailed, covering the main points discussed, key decisions made, and any outstanding questions. Use clear section headings.";
    } else if (options.style === "action_items") {
      prompt += "The summary must be structured into three sections: 1. Goal/Topic, 2. Key Decisions, and 3. Next Action Items. Do not include conversational filler.";
    } else {
      prompt += "Provide a comprehensive summary that retains all critical information, including user goals and identified entities.";
    }

    prompt += "\n\n--- CONVERSATION HISTORY ---\n\n";
    return prompt;
  }

  private formatHistoryForLLM(history: Message[]): string {
    let formatted = "";
    for (const message of history) {
      if (message.role === "user") {
        formatted += `User: ${message.content.join(" ")}\n`;
      } else if (message.role === "assistant") {
        const textContent = message.content.filter((block): block is TextBlock => block.type === "text")
          .map((block): string => block.text)
          .join(" ");
        formatted += `Assistant: ${textContent}\n`;
      } else if (message.role === "tool") {
        formatted += `Tool Result (${message.tool_use_id}): ${message.content}\n`;
      }
    }
    return formatted;
  }

  public async generateSummary(
    history: Message[],
    options: SummarizationOptions = {}
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(options);
    const historyText = this.formatHistoryForLLM(history);

    return this.llmAdapter.summarize(history, options, systemPrompt);
  }

  public async mergeSummaryIntoContext(
    history: Message[],
    summary: string,
    options: SummarizationOptions = {}
  ): Promise<Message[]> {
    const newHistory: Message[] = [];

    // 1. Keep the initial context messages (if any)
    // For simplicity, we assume the summary replaces the *entire* history for the prompt context,
    // but we'll keep the last few messages to provide immediate context for the next turn.
    const contextWindowSize = 5;
    const messagesToKeep = history.slice(Math.max(0, history.length - contextWindowSize));

    // 2. Create the summary message
    const summaryMessage: Message = {
      role: "system", // Using 'system' role conceptually for the summary injection
      content: [{ type: "text", text: `[SUMMARY]: ${summary}` }]
    };

    // 3. Build the new history: [Initial Context] + [Summary] + [Last N Messages]
    // In a real system, the summary replaces the bulk of the history.
    const mergedHistory: Message[] = [
      ...messagesToKeep,
      summaryMessage,
      // Optionally, you might append the last user message if it's critical
    ];

    return mergedHistory;
  }
}

export { ConversationSummarizer, LLMAdapter };