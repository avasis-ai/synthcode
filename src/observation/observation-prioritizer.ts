import { Message, ContentBlock, TextBlock } from "./types";

export interface SourceMetadata {
  credibilityScore: number;
  sourceType: "API" | "User" | "System" | "Unknown";
  reliabilityTags: string[];
}

export interface Observation {
  source: SourceMetadata;
  content: string;
  timestamp: number;
}

export interface PrioritizationRule {
  apply(source: SourceMetadata, content: string): number;
}

export interface WeightedObservation {
  originalObservation: Observation;
  finalWeight: number;
  priorityScore: number;
  processedContent: string;
}

export class ObservationPrioritizer {
  private rules: PrioritizationRule[] = [];

  constructor() {}

  addRule(rule: PrioritizationRule): void {
    this.rules.push(rule);
  }

  /**
   * Processes a list of raw observations, applying all registered rules
   * to calculate a weighted and prioritized payload.
   * @param observations The list of incoming observations.
   * @returns An array of weighted and prioritized observations.
   */
  processObservations(observations: Observation[]): WeightedObservation[] {
    return observations.map(observation => {
      let totalWeight = 1.0;
      let accumulatedScore = 0;
      let processedContent = observation.content;

      // 1. Apply all rules to calculate combined weight and score
      for (const rule of this.rules) {
        const ruleWeight = rule.apply(observation.source, observation.content);
        totalWeight += ruleWeight;
        accumulatedScore += ruleWeight;
      }

      // 2. Normalize and finalize the weight
      // We use a sigmoid-like function or simple clamping to ensure weights are meaningful.
      // Here, we normalize the accumulated score against a base weight.
      const finalWeight = Math.min(2.0, totalWeight);

      return {
        originalObservation: observation,
        finalWeight: finalWeight,
        priorityScore: accumulatedScore,
        processedContent: processedContent,
      };
    });
  }
}

class CredibilityRule implements PrioritizationRule {
  apply(source: SourceMetadata, content: string): number {
    let weight = 0;

    // Boost based on source credibility
    weight += source.credibilityScore * 0.5;

    // Boost if the source is 'API' and has high reliability tags
    if (source.sourceType === "API" && source.reliabilityTags.includes("verified")) {
      weight += 0.3;
    }

    // Boost if the content contains keywords indicating critical information
    const criticalKeywords = ["critical", "error", "failure", "urgent"];
    for (const keyword of criticalKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        weight += 0.15;
      }
    }

    return Math.max(0, weight);
  }
}

class TypeBoostRule implements PrioritizationRule {
  apply(source: SourceMetadata, content: string): number {
    let weight = 0;

    // Boost if the source type is 'System'
    if (source.sourceType === "System") {
      weight += 0.4;
    }

    // Boost if the content is very short (suggesting a direct, immediate observation)
    if (content.length < 50 && content.length > 0) {
      weight += 0.1;
    }

    return weight;
  }
}

export const createPrioritizer = (): ObservationPrioritizer => {
  const prioritizer = new ObservationPrioritizer();
  prioritizer.addRule(new CredibilityRule());
  prioritizer.addRule(new TypeBoostRule());
  return prioritizer;
};