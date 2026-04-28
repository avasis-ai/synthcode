import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type DecayCurveType = "exponential" | "linear" | "time-decay" | "usage-decay";

export interface DecayCurve {
  type: DecayCurveType;
  // Parameters specific to the curve type (e.g., rate, initial value)
  parameters: Record<string, number>;
}

export interface ContextEntry {
  id: string;
  message: Message;
  timestamp: number;
  usageCount: number;
  contextType: "core_knowledge" | "transient_tool_output" | "user_interaction";
}

export interface DecayRule {
  contextType: "core_knowledge" | "transient_tool_output" | "user_interaction";
  curve: DecayCurve;
  weight: number;
}

export type DecayFactor = number;

export class ContextualMemoryDecaySchedulerV2 {
  private rules: DecayRule[];

  constructor(rules: DecayRule[]) {
    this.rules = rules;
  }

  private calculateCurveFactor(curve: DecayCurve, currentTime: number, entry: ContextEntry): number {
    const { type, parameters } = curve;
    switch (type) {
      case "exponential":
        const decayRate = parameters.get('rate') || 0.01;
        return Math.exp(-decayRate * (currentTime - entry.timestamp));
      case "linear":
        const decayPerUnit = parameters.get('per_unit') || 0.001;
        return Math.max(0, 1 - decayPerUnit * (currentTime - entry.timestamp));
      case "time-decay":
        const timeDecayFactor = parameters.get('factor') || 0.5;
        return Math.pow(timeDecayFactor, (currentTime - entry.timestamp) / 1000);
      case "usage-decay":
        const usageDecayFactor = parameters.get('factor') || 0.95;
        return Math.pow(usageDecayFactor, entry.usageCount);
      default:
        return 1.0;
    }
  }

  private getDecayFactorForEntry(entry: ContextEntry, currentTime: number): DecayFactor {
    const matchingRules = this.rules.filter(rule => rule.contextType === entry.contextType);

    if (matchingRules.length === 0) {
      return 1.0; // No rule found, no decay applied
    }

    let totalDecayScore = 0;

    for (const rule of matchingRules) {
      const curveFactor = this.calculateCurveFactor(rule.curve, currentTime, entry);
      // Combine curve factor with rule weight
      totalDecayScore += curveFactor * rule.weight;
    }

    // Return the average or weighted sum of decay scores.
    // Here we use the sum, assuming weights are normalized or additive.
    return Math.min(1.0, totalDecayScore);
  }

  /**
   * Calculates the decay factor for every provided context entry.
   * @param entries The list of context entries to score.
   * @param currentTime The current time reference for decay calculation.
   * @returns An array of objects containing the entry and its calculated decay factor.
   */
  public calculateDecayFactors(entries: ContextEntry[], currentTime: number): { entry: ContextEntry; factor: DecayFactor }[] {
    return entries.map(entry => ({
      entry: entry,
      factor: this.getDecayFactorForEntry(entry, currentTime),
    }));
  }

  /**
   * Filters out entries whose decay factor falls below a specified threshold.
   * @param entries The list of context entries.
   * @param currentTime The current time reference.
   * @param threshold The minimum acceptable decay factor (0.0 to 1.0).
   * @returns A filtered array of context entries that should be retained.
   */
  public pruneContext(entries: ContextEntry[], currentTime: number, threshold: DecayFactor): ContextEntry[] {
    const scoredEntries = this.calculateDecayFactors(entries, currentTime);
    return scoredEntries
      .filter(scored => scored.factor >= threshold)
      .map(scored => scored.entry);
  }
}