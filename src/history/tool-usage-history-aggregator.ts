import { ToolInvocationRecord } from "./tool-invocation-record";

export interface ToolUsageMetrics {
  callCount: number;
  totalLatencyMs: number;
  totalApiCalls: number;
  averageLatencyMs: number;
  // Potentially add standard deviation or variance later
}

export interface UsageSummary {
  toolMetrics: Record<string, ToolUsageMetrics>;
  totalToolCalls: number;
  overallAverageLatencyMs: number;
}

export class ToolUsageHistoryAggregator {
  private toolMetrics: Map<string, ToolUsageMetrics>;

  constructor() {
    this.toolMetrics = new Map();
  }

  recordInvocation(record: ToolInvocationRecord): void {
    const toolName = record.toolName;
    const latency = record.latencyMs;

    if (!this.toolMetrics.has(toolName)) {
      this.toolMetrics.set(toolName, {
        callCount: 0,
        totalLatencyMs: 0,
        totalApiCalls: 0,
        averageLatencyMs: 0,
      });
    }

    const metrics = this.toolMetrics.get(toolName)!;

    metrics.callCount += 1;
    metrics.totalLatencyMs += latency;
    metrics.totalApiCalls += 1;
    metrics.averageLatencyMs = metrics.totalLatencyMs / metrics.callCount;

    this.toolMetrics.set(toolName, metrics);
  }

  private calculateOverallMetrics(): {
    totalToolCalls: number;
    totalLatencyMs: number;
    overallAverageLatencyMs: number;
  } {
    let totalToolCalls = 0;
    let totalLatencyMs = 0;

    for (const metrics of this.toolMetrics.values()) {
      totalToolCalls += metrics.callCount;
      totalLatencyMs += metrics.totalLatencyMs;
    }

    const overallAverageLatencyMs = totalToolCalls > 0 ? totalLatencyMs / totalToolCalls : 0;

    return {
      totalToolCalls,
      totalLatencyMs,
      overallAverageLatencyMs,
    };
  }

  public finalizeMetrics(): UsageSummary {
    const toolMetrics: Record<string, ToolUsageMetrics> = {};
    for (const [name, metrics] of this.toolMetrics.entries()) {
      toolMetrics[name] = { ...metrics };
    }

    const overall = this.calculateOverallMetrics();

    return {
      toolMetrics: toolMetrics,
      totalToolCalls: overall.totalToolCalls,
      overallAverageLatencyMs: overall.overallAverageLatencyMs,
    };
  }
}