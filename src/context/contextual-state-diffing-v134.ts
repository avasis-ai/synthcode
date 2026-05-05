import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceConstraint {
  maxMemoryUsageBytes: number;
  maxCpuCycles: number;
  decayRatePerSecond: number;
}

export interface StateDiff {
  path: string;
  oldValue: any;
  newValue: any;
  changeType: "added" | "removed" | "modified";
}

export interface ContextualStateDiffReport {
  diff: StateDiff[];
  relevanceScore: number;
  estimatedCostImpact: number;
}

export class TemporalResourceAwareDiffCalculator {
  private readonly resourceConstraints: ResourceConstraint;

  constructor(resourceConstraints: ResourceConstraint) {
    this.resourceConstraints = resourceConstraints;
  }

  private calculateDecay(timeElapsedSeconds: number): number {
    return Math.exp(-this.resourceConstraints.decayRatePerSecond * timeElapsedSeconds);
  }

  private calculateChangeWeight(diff: StateDiff): number {
    const costFactor = 1.0; // Simplified cost factor calculation
    const relevanceFactor = 0.5; // Simplified relevance factor calculation
    return (costFactor * 0.6 + relevanceFactor * 0.4);
  }

  public calculateDiff(
    currentState: any,
    previousState: any,
    timeElapsedSeconds: number
  ): ContextualStateDiffReport {
    const diff: StateDiff[] = [];
    let totalRelevanceScore = 0;
    let totalEstimatedCostImpact = 0;

    // Simple deep comparison simulation for demonstration
    const keys = new Set([...Object.keys(currentState), ...Object.keys(previousState)]);

    for (const key of keys) {
      const currentVal = currentState[key];
      const previousVal = previousState[key];

      if (currentVal === undefined && previousVal !== undefined) {
        diff.push({
          path: key,
          oldValue: previousVal,
          newValue: undefined,
          changeType: "removed",
        });
      } else if (currentVal !== undefined && previousVal === undefined) {
        diff.push({
          path: key,
          oldValue: undefined,
          newValue: currentVal,
          changeType: "added",
        });
      } else if (currentVal !== previousVal) {
        diff.push({
          path: key,
          oldValue: previousVal,
          newValue: currentVal,
          changeType: "modified",
        });
      }
    }

    // Apply temporal decay and weighting
    const decayFactor = this.calculateDecay(timeElapsedSeconds);

    for (const diffItem of diff) {
      const weight = this.calculateChangeWeight(diffItem);
      // Relevance is decayed by time and weighted by change significance
      const relevance = weight * decayFactor;
      // Cost impact is weighted by change significance and constrained by resource limits
      const costImpact = Math.min(weight * 1.0, this.resourceConstraints.maxCpuCycles / 1000);

      totalRelevanceScore += relevance;
      totalEstimatedCostImpact += costImpact;
    }

    return {
      diff: diff,
      relevanceScore: Math.max(0, totalRelevanceScore),
      estimatedCostImpact: Math.max(0, totalEstimatedCostImpact),
    };
  }
}