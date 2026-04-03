import type { Message } from "../types.js";

export interface TokenCount {
  total: number;
  byRole: Record<string, number>;
}

export function estimateTokens(text: string): number {
  const chars = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(Math.ceil(chars / 4), Math.ceil(words * 1.3));
}

export function estimateMessageTokens(message: Message): number {
  if (message.role === "user") {
    return estimateTokens(message.content) + 4;
  }

  if (message.role === "tool") {
    return estimateTokens(message.content) + 4;
  }

  let tokens = 0;
  for (const block of message.content) {
    if (block.type === "text") {
      tokens += estimateTokens(block.text) + 4;
    } else if (block.type === "tool_use") {
      tokens += estimateTokens(block.name) + estimateTokens(JSON.stringify(block.input)) + 4;
    } else if (block.type === "thinking") {
      tokens += estimateTokens(block.thinking) + 4;
    }
  }
  return tokens;
}

export function estimateConversationTokens(messages: Message[]): TokenCount {
  const byRole: Record<string, number> = {};

  let total = 0;
  for (const message of messages) {
    const msgTokens = estimateMessageTokens(message) + 10;
    total += msgTokens;
    byRole[message.role] = (byRole[message.role] ?? 0) + msgTokens;
  }

  return { total, byRole };
}
