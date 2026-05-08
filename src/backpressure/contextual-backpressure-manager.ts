import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type MetricKey = "latency" | "cost" | "load" | "utilization";

export interface Metric {
  key: MetricKey;
  value: number;
}

export interface BackpressureConfig {
  weights: Record<MetricKey, number>;
  threshold: number;
}

export type AdjustmentRule =
  | { type: "ReduceContextSize"; factor: number }
  | { type: "IncreaseWaitTime"; seconds: number }
  | { type: "SimplifyPlan"; complexityLevel: number }
  | { type: "DeferNonCriticalSteps"; reason: string };

export class ContextualBackpressureManager {
  private config: BackpressureConfig;

  constructor(config: BackpressureConfig) {
    this.config = config;
  }

  private calculateWeightedScore(metrics: Metric[]): number {
    let totalScore = 0;
    for (const metric of metrics) {
      const weight = this.config.weights[metric.key];
      if (weight !== undefined) {
        totalScore += metric.value * weight;
      }
    }
    return totalScore;
  }

  public calculateAdjustment(metrics: Metric[]): AdjustmentRule[] {
    const weightedScore = this.calculateWeightedScore(metrics);
    const rules: AdjustmentRule[] = [];

    if (weightedScore >= this.config.threshold) {
      if (weightedScore > this.config.threshold * 1.2) {
        rules.push({ type: "ReduceContextSize", factor: 0.7 });
      }
      rules.push({ type: "IncreaseWaitTime", seconds: 2 });
    } else if (weightedScore > this.config.threshold) {
      rules.push({ type: "SimplifyPlan", complexityLevel: 0.8 });
    }

    if (rules.length === 0) {
      return [];
    }

    return rules;
  }
}

export { ContextualBackpressureManager };