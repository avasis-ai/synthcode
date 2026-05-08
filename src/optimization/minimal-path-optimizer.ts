import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export class MinimalPathOptimizer {
  constructor() {}

  optimize(trace: Message[]): Message[] {
    if (!trace || trace.length === 0) {
      return [];
    }

    const optimizedPath: Message[] = [];
    let lastStateChangeIndex = -1;

    for (let i = 0; i < trace.length; i++) {
      const message = trace[i];

      if (this.isEssentialMessage(message, i, trace)) {
        optimizedPath.push(message);
        lastStateChangeIndex = i;
      }
    }

    return optimizedPath;
  }

  private isEssentialMessage(message: Message, currentIndex: number, trace: Message[]): boolean {
    if (message.role === "user") {
      return true;
    }

    if (message.role === "tool") {
      // Tool results are usually essential if they provide new information
      if (message.content && !message.content.includes("No change detected")) {
        return true;
      }
      return false;
    }

    if (message.role === "assistant") {
      const contentBlocks = message.content;
      if (!contentBlocks || contentBlocks.length === 0) {
        return false;
      }

      let hasEssentialContent = false;
      let hasToolUse = false;

      for (const block of contentBlocks) {
        if (block.type === "tool_use") {
          hasToolUse = true;
        }
      }

      // If the assistant generated a tool use, it's usually necessary
      if (hasToolUse) {
        return true;
      }

      // If the assistant generated text, check if it's just redundant thinking/setup
      if (contentBlocks.some(b => b.type === "text")) {
        // Simple heuristic: If the text is substantial and not just a continuation of thought, keep it.
        const textContent = contentBlocks.filter(b => b.type === "text").map(b => b.text).join(" ");
        if (textContent.length > 10) {
          return true;
        }
      }

      // Filter out pure thinking blocks unless they are the only output
      if (contentBlocks.every(b => b.type === "thinking")) {
        return false;
      }

      return true;
    }

    return false;
  }
}