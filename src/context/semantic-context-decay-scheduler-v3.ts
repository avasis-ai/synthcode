import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface DecayRule {
  weight: number;
  decayFunction: (ageSeconds: number) => number;
  temporalConstraint?: {
    minAgeSeconds: number;
    maxAgeSeconds: number;
  };
}

export interface ContextEntry {
  message: Message;
  timestamp: number;
  decayFactors: DecayRule[];
}

export class SemanticContextDecaySchedulerV3 {
  private rules: DecayRule[];

  constructor(rules: DecayRule[]) {
    this.rules = rules;
  }

  private calculateDecayFactor(entry: ContextEntry, rule: DecayRule): number {
    const ageSeconds = Math.floor((Date.now() - entry.timestamp) / 1000);

    if (rule.temporalConstraint) {
      const { minAgeSeconds, maxAgeSeconds } = rule.temporalConstraint;
      if (ageSeconds < minAgeSeconds || ageSeconds > maxAgeSeconds) {
        return 0;
      }
    }

    const decayValue = rule.decayFunction(ageSeconds);
    return decayValue;
  }

  public calculateTotalDecay(entry: ContextEntry): number {
    if (this.rules.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const rule of this.rules) {
      const decay = this.calculateDecayFactor(entry, rule);
      const weightedDecay = decay * rule.weight;
      weightedSum += weightedDecay;
      totalWeight += rule.weight;
    }

    if (totalWeight === 0) {
      return 0;
    }

    // Return the weighted average decay factor
    return weightedSum / totalWeight;
  }

  public getDecayRules(): DecayRule[] {
    return this.rules;
  }
}