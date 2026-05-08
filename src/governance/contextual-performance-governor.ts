import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type PerformanceMetrics = {
  timestamp: number;
  latencyMs: number;
  cost: number;
  tokens: number;
};

export type PerformanceAdjustmentSignal = {
  signal: "OPTIMIZE" | "WARN" | "OK";
  reason: string;
  action?: (context: any) => any;
};

export class MetricTracker {
  private metrics: PerformanceMetrics[] = [];
  private readonly windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  recordStep(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.windowSize) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.latencyMs, 0);
    return total / this.metrics.length;
  }

  getAverageCost(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.cost, 0);
    return total / this.metrics.length;
  }

  getAverageTokens(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.tokens, 0);
    return total / this.metrics.length;
  }

  getVariance(key: keyof PerformanceMetrics): number {
    if (this.metrics.length < 2) return 0;
    const mean = this.metrics.reduce((sum, m) => sum + m[key], 0) / this.metrics.length;
    const squaredDifferences = this.metrics.map(m => Math.pow(m[key] - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((sum, diff) => sum + diff, 0);
    return sumOfSquaredDifferences / (this.metrics.length - 1);
  }
}

export class ContextualPerformanceGovernor {
  private tracker: MetricTracker;
  private readonly maxLatencyMs: number;
  private readonly maxCostPerStep: number;
  private readonly minTokenEfficiency: number;

  constructor(
    windowSize: number = 15,
    maxLatencyMs: number = 1500,
    maxCostPerStep: number = 0.5,
    minTokenEfficiency: number = 0.1
  ) {
    this.tracker = new MetricTracker(windowSize);
    this.maxLatencyMs = maxLatencyMs;
    this.maxCostPerStep = maxCostPerStep;
    this.minTokenEfficiency = minTokenEfficiency;
  }

  recordStep(metrics: PerformanceMetrics): void {
    this.tracker.recordStep(metrics);
  }

  checkPerformance(
    currentContext: any,
    currentMetrics: PerformanceMetrics
  ): PerformanceAdjustmentSignal {
    this.recordStep(currentMetrics);

    const avgLatency = this.tracker.getAverageLatency();
    const avgCost = this.tracker.getAverageCost();
    const avgTokens = this.tracker.getAverageTokens();
    const latencyVariance = this.tracker.getVariance("latencyMs");

    let signal: PerformanceAdjustmentSignal = {
      signal: "OK",
      reason: "Performance within acceptable bounds.",
    };

    if (avgLatency > this.maxLatencyMs || latencyVariance > 500) {
      signal = {
        signal: "WARN",
        reason: `High latency detected (Avg: ${avgLatency.toFixed(0)}ms, Var: ${latencyVariance.toFixed(0)}ms). Consider simplifying the prompt or reducing context size.`,
        action: (context) => ({
          ...context,
          metadata: {
            ...context.metadata,
            suggest_optimization: "Reduce context size",
          },
        }),
      };
    } else if (avgCost > this.maxCostPerStep || avgTokens === 0) {
      signal = {
        signal: "OPTIMIZE",
        reason: `High cost or low token efficiency detected (Avg Cost: ${avgCost.toFixed(2)}). Switch to a cheaper model or force summarization.`,
        action: (context) => ({
          ...context,
          metadata: {
            ...context.metadata,
            suggest_optimization: "Switch model or summarize",
          },
        }),
      };
    } else if (avgCost > this.maxCostPerStep * 1.5) {
      signal = {
        signal: "WARN",
        reason: `Cost approaching critical threshold (Avg Cost: ${avgCost.toFixed(2)}). Proceed with caution.`,
      };
    }

    return signal;
  }
}