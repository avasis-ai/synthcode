import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface ContextualSummarizer {
  summarizeContext(
    history: Message[],
    focusIntent?: string
  ): Promise<string>;
}

class ContextualHistorySummarizerWithIntentFocus implements ContextualSummarizer {
  private readonly modelName: string;

  constructor(modelName: string = "gpt-4o") {
    this.modelName = modelName;
  }

  private formatHistory(history: Message[]): string {
    let context = "";
    for (const message of history) {
      if (message.role === "user") {
        context += `[USER]: ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        let assistantContent = message.content.map(block => {
          if (block.type === "text") return `[TEXT]: ${block.text}`;
          if (block.type === "tool_use") return `[TOOL_USE]: ${block.name}(${JSON.stringify(block.input)})`;
          if (block.type === "thinking") return `[THINKING]: ${block.thinking}`;
          return "";
        }).join(" | ");
        context += `[ASSISTANT]: ${assistantContent}\n\n`;
      } else if (message.role === "tool") {
        context += `[TOOL_RESULT]: ${message.content}\n\n`;
      }
    }
    return context;
  }

  private buildPrompt(history: Message[], focusIntent: string | undefined): string {
    let prompt = `You are an expert context summarization engine. Your goal is to summarize the provided conversation history, focusing specifically on the following intent: "${focusIntent}".\n\n`;

    if (focusIntent) {
      prompt += `Instructions: When summarizing, you MUST prioritize details, decisions, or information directly relevant to achieving or understanding the goal stated above. Filter out tangential discussions, greetings, or irrelevant context.\n\n`;
    } else {
      prompt += `Instructions: Provide a comprehensive summary of the entire conversation history.\n\n`;
    }

    prompt += "--- CONVERSATION HISTORY ---\n";
    prompt += this.formatHistory(history);
    prompt += "\n\n--- SUMMARY ---\n";
    prompt += "Provide a concise, actionable summary based on the instructions.";
    return prompt;
  }

  async summarizeContext(
    history: Message[],
    focusIntent?: string
  ): Promise<string> {
    const prompt = this.buildPrompt(history, focusIntent);

    // Mock LLM call for demonstration purposes. In a real scenario, this would call an API.
    console.log(`[Mock LLM Call] Sending prompt for intent: ${focusIntent || 'General'}`);
    console.log("--------------------------------------------------");
    console.log(prompt);
    console.log("--------------------------------------------------");

    // Simulate API latency and response
    await new Promise(resolve => setTimeout(resolve, 100));

    if (focusIntent) {
      return `[Intent-Focused Summary]: Based on the intent to "${focusIntent}", the key takeaways are: 1. The primary issue revolves around the API endpoint validation. 2. The user confirmed the required payload structure is {id: string, data: any}. 3. The next step must involve reviewing the error handling logic for 400 responses.`;
    } else {
      return `[General Summary]: The conversation covered initial setup, a discussion about API validation, and a final agreement on the next steps. The user provided context on the payload structure, and the assistant confirmed the necessary review points.`;
    }
  }
}

export const createContextualSummarizer = (modelName: string = "gpt-4o"): ContextualSummarizer => {
  return new ContextualHistorySummarizerWithIntentFocus(modelName);
};