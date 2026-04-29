import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type ContextType = "user" | "assistant" | "tool";

export interface DecayCurve {
  initialWeight: number;
  decayRate: number;
  decayPeriod: number; // Time in milliseconds for one decay step
}

export interface DecayRule {
  contextType: ContextType;
  curve: DecayCurve;
  // Optional minimum age to prevent immediate decay on critical context
  minAgeMs?: number;
}

export interface ContextEntry {
  message: Message;
  timestamp: number;
  decayRules: DecayRule[];
}

export class ContextualMemoryDecaySchedulerV4 {
  private decayRules: DecayRule[];

  constructor(decayRules: DecayRule[]) {
    this.decayRules = decayRules;
  }

  private calculateDecayFactor(
    entry: ContextEntry,
    currentTime: number
  ): number {
    const timeElapsed = currentTime - entry.timestamp;
    let totalFactor = 1.0;

    for (const rule of this.decayRules) {
      if (rule.contextType !== (entry.message as any).role) {
        continue;
      }

      if (rule.minAgeMs !== undefined && timeElapsed < rule.minAgeMs) {
        continue;
      }

      const curve = rule.curve;
      if (curve.decayPeriod <= 0) {
        continue;
      }

      const steps = Math.floor(timeElapsed / curve.decayPeriod);
      // Exponential decay: Factor = InitialWeight * (1 - decayRate)^steps
      const factor = curve.initialWeight * Math.pow(1 - curve.decayRate, steps);
      totalFactor *= factor;
    }

    return totalFactor;
  }

  /**
   * Calculates the aggregate decay factor for a given context entry based on all applicable rules.
   * @param entry The context entry to evaluate.
   * @param currentTime The current time in milliseconds.
   * @returns The combined decay factor (1.0 means no decay).
   */
  public getDecayFactor(entry: ContextEntry, currentTime: number): number {
    return this.calculateDecayFactor(entry, currentTime);
  }

  /**
   * Determines if an entry should be pruned based on its decay factor and a threshold.
   * @param entry The context entry to evaluate.
   * @param currentTime The current time in milliseconds.
   * @param threshold The minimum acceptable decay factor (e.g., 0.1).
   * @returns True if the entry should be pruned, false otherwise.
   */
  public shouldPrune(entry: ContextEntry, currentTime: number, threshold: number): boolean {
    const decayFactor = this.getDecayFactor(entry, currentTime);
    return decayFactor < threshold;
  }
}