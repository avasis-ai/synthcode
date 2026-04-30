import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type DecayCurve = (ageSeconds: number) => number;

export interface DecayRule {
  /**
   * Calculates the decay weight for a context entry.
   * @param contextType The type of the context entry (e.g., 'user', 'assistant', 'tool').
   * @param metadata Additional metadata about the entry (e.g., source, importance score).
   * @param ageSeconds The age of the context entry in seconds.
   * @returns A weight factor (0.0 to 1.0) representing its current relevance.
   */
  calculateWeight: (contextType: 'user' | 'assistant' | 'tool', metadata: Record<string, unknown>, ageSeconds: number) => number;
}

export interface DecayScheduler {
  /**
   * Calculates the combined decay weight for a list of context messages.
   * @param messages The list of context messages.
   * @param decayRules An array of rules to apply.
   * @param decayCurve A base decay curve function.
   * @returns An object mapping each message to its calculated final weight.
   */
  calculateWeights(messages: Message[], decayRules: DecayRule[], decayCurve: DecayCurve): Record<string, number>;
}

class ContextualMemoryDecaySchedulerV5 implements DecayScheduler {
  private readonly defaultDecayCurve: DecayCurve = (ageSeconds) => Math.exp(-0.01 * ageSeconds);

  calculateWeights(messages: Message[], decayRules: DecayRule[], decayCurve: DecayCurve): Record<string, number> {
    if (!messages || messages.length === 0) {
      return {};
    }

    const weights: Record<string, number> = {};

    for (const message of messages) {
      const messageId = `${message.role}-${message.content.substring(0, 10)}`; // Simple unique ID approximation
      let totalWeight = 1.0;

      for (const rule of decayRules) {
        const contextType = message.role === 'user' ? 'user' : message.role === 'assistant' ? 'assistant' : 'tool';
        const metadata: Record<string, unknown> = {
          source: contextType,
          importance: 1.0, // Placeholder for more complex metadata integration
        };

        // Assume age is proportional to index for simplicity in this implementation structure
        const ageSeconds = messages.length - messages.indexOf(message);

        const ruleWeight = rule.calculateWeight(contextType, metadata, ageSeconds);
        totalWeight *= ruleWeight;
      }

      // Apply the base decay curve multiplicatively
      const finalWeight = totalWeight * decayCurve(messages.length - messages.indexOf(message));
      weights[messageId] = Math.max(0.0, Math.min(1.0, finalWeight));
    }

    return weights;
  }
}

export const createContextualMemoryDecaySchedulerV5 = (): ContextualMemoryDecaySchedulerV5 => {
  return new ContextualMemoryDecaySchedulerV5();
};