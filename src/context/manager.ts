import type { Message, ContentBlock, ContextConfig, CompactionResult } from "../types.js";
import { DEFAULT_CONTEXT_WINDOW, DEFAULT_MAX_OUTPUT_TOKENS, DEFAULT_COMPACT_THRESHOLD } from "../types.js";
import { estimateConversationTokens, estimateMessageTokens } from "./tokenizer.js";

const PRUNE_MINIMUM = 20_000;
const PRUNE_PROTECT_TOKENS = 40_000;
const PROTECTED_TOOL_TYPES = new Set(["skill", "delegate_agent"]);
const RECENT_TURNS_TO_PROTECT = 2;

export interface ContextCheck {
  totalTokens: number;
  availableTokens: number;
  usagePercent: number;
  needsCompact: boolean;
  recommendedMethod: "snip" | "compact";
}

export class ContextManager {
  readonly maxTokens: number;
  readonly maxOutputTokens: number;
  readonly compactThreshold: number;

  constructor(config?: ContextConfig) {
    this.maxTokens = config?.maxTokens ?? DEFAULT_CONTEXT_WINDOW;
    this.maxOutputTokens = config?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
    this.compactThreshold = config?.compactThreshold ?? DEFAULT_COMPACT_THRESHOLD;
  }

  check(messages: Message[]): ContextCheck {
    const { total: totalTokens } = estimateConversationTokens(messages);
    const availableTokens = this.maxTokens - totalTokens - this.maxOutputTokens;
    const usagePercent = totalTokens / this.maxTokens;
    const needsCompact = usagePercent >= this.compactThreshold;
    let recommendedMethod: "snip" | "compact";

    if (usagePercent > 0.95) {
      recommendedMethod = "compact";
    } else {
      recommendedMethod = "snip";
    }

    return { totalTokens, availableTokens, usagePercent, needsCompact, recommendedMethod };
  }

  async compact(messages: Message[], summaryFn?: (messages: Message[]) => Promise<string>): Promise<CompactionResult> {
    const contextCheck = this.check(messages);

    if (!contextCheck.needsCompact) {
      return { messages: [...messages], tokensSaved: 0, method: "none" };
    }

    const originalTokens = contextCheck.totalTokens;

    if (summaryFn && contextCheck.recommendedMethod === "compact") {
      const recentCount = Math.max(Math.ceil(messages.length * 0.2), 1);
      const cutoffIndex = messages.length - recentCount;
      const oldMessages = messages.slice(0, cutoffIndex);
      const recentMessages = messages.slice(cutoffIndex);

      const summary = await summaryFn(oldMessages);
      const summaryMessage: Message = {
        role: "user",
        content: `Here is a summary of our previous conversation:\n${summary}`,
      };

      const compacted = [summaryMessage, ...recentMessages];
      const newTokens = estimateConversationTokens(compacted).total;

      return {
        messages: compacted,
        tokensSaved: originalTokens - newTokens,
        method: "compact",
      };
    }

    const keepFirst = 1;
    const keepLast = 20;
    const keepMin = keepFirst + keepLast;

    if (messages.length <= keepMin) {
      return { messages: [...messages], tokensSaved: 0, method: "none" };
    }

    let result = [...messages];
    const targetUsage = 0.6;

    while (result.length > keepMin) {
      const { total } = estimateConversationTokens(result);
      if (total / this.maxTokens < targetUsage) break;

      const removeCount = Math.max(1, Math.floor((result.length - keepMin) * 0.3));
      const removeEnd = Math.min(keepFirst + removeCount, result.length - keepLast);
      result = [result[0], ...result.slice(removeEnd)];
    }

    const newTokens = estimateConversationTokens(result).total;

    return {
      messages: result,
      tokensSaved: originalTokens - newTokens,
      method: "snip",
    };
  }

  pruneToolOutputs(messages: Message[]): Message[] {
    let totalPruned = 0;
    let turnCount = 0;
    const result = [...messages];

    for (let i = result.length - 1; i >= 0; i--) {
      const msg = result[i];
      if (msg.role === "user") {
        turnCount++;
        if (turnCount <= RECENT_TURNS_TO_PROTECT) continue;
      }
      if (msg.role !== "assistant" || !Array.isArray(msg.content)) continue;

      for (const block of msg.content) {
        if (block.type !== "tool_use") continue;
        if (PROTECTED_TOOL_TYPES.has(block.name)) continue;

        const toolResultIdx = result.findIndex(
          (m, j) => j > i && m.role === "tool" && (m as { tool_use_id?: string }).tool_use_id === block.id,
        );
        if (toolResultIdx === -1) continue;

        const toolResult = result[toolResultIdx];
        const output = (toolResult as { content: string }).content;
        const estTokens = Math.ceil(output.length / 4);

        if (totalPruned + estTokens >= PRUNE_MINIMUM && totalPruned >= PRUNE_PROTECT_TOKENS) {
          return result;
        }

        totalPruned += estTokens;
        result[toolResultIdx] = {
          ...(toolResult as unknown as Record<string, unknown>),
          content: `[Output pruned: ${estTokens} tokens saved]`,
          is_error: false,
        } as typeof toolResult;
      }
    }

    return result;
  }

  getAvailableTokens(messages: Message[]): number {
    return this.maxTokens - estimateConversationTokens(messages).total - this.maxOutputTokens;
  }

  getUsagePercent(messages: Message[]): number {
    return estimateConversationTokens(messages).total / this.maxTokens;
  }
}
