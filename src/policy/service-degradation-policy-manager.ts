import {
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type ExecutionResult = {
  success: boolean;
  result: unknown;
  metrics: Record<string, number>;
};

export interface ServiceMetrics {
  latencyMs: number;
  errorRate: number;
  cost: number;
  resourceUsage: number;
}

export type ServiceCall<T> = (context: Record<string, unknown>) => Promise<{ result: T; metrics: ServiceMetrics }>;

export interface FallbackStrategy {
  name: string;
  execute: (context: Record<string, unknown>) => Promise<{ result: unknown; metrics: ServiceMetrics }>;
}

export interface DegradationPolicy<T> {
  primaryCall: ServiceCall<T>;
  fallbackStrategies: FallbackStrategy[];
}

export class ServiceDegradationPolicyManager {
  private readonly degradationThresholds: {
    maxLatencyMs: number;
    maxErrorRate: number;
    maxCost: number;
  };

  constructor(
    {
      maxLatencyMs = 1000,
      maxErrorRate = 0.2,
      maxCost = 5.0,
    }: {
      maxLatencyMs: number;
      maxErrorRate: number;
      maxCost: number;
    } = {}
  ) {
    this.degradationThresholds = {
      maxLatencyMs,
      maxErrorRate,
      maxCost,
    };
  }

  private isDegraded(metrics: ServiceMetrics): boolean {
    return (
      metrics.latencyMs > this.degradationThresholds.maxLatencyMs ||
      metrics.errorRate > this.degradationThresholds.maxErrorRate ||
      metrics.cost > this.degradationThresholds.maxCost
    );
  }

  public async executePolicy(
    policy: DegradationPolicy<any>,
    context: Record<string, unknown>
  ): Promise<{ result: unknown; metrics: ServiceMetrics; source: string }> {
    const { primaryCall, fallbackStrategies } = policy;

    // 1. Attempt Primary Call
    try {
      const primaryResult = await primaryCall(context);
      const metrics = primaryResult.metrics;

      if (this.isDegraded(metrics)) {
        return this.executeFallbackChain(
          fallbackStrategies,
          context,
          "Primary Call (Degraded)"
        );
      }

      return {
        result: primaryResult.result,
        metrics: metrics,
        source: "Primary Call",
      };
    } catch (error) {
      // 2. Primary Call Failed (Hard failure)
      console.error("Primary call failed, initiating fallback chain.", error);
      return this.executeFallbackChain(
        fallbackStrategies,
        context,
        "Primary Call (Failed)"
      );
    }
  }

  private async executeFallbackChain(
    strategies: FallbackStrategy[],
    context: Record<string, unknown>,
    source: string
  ): Promise<{ result: unknown; metrics: ServiceMetrics; source: string }> {
    for (const strategy of strategies) {
      try {
        const result = await strategy.execute(context);
        // Assuming the fallback result always provides metrics
        return {
          result: result.result,
          metrics: result.metrics,
          source: `Fallback Strategy: ${strategy.name}`,
        };
      } catch (e) {
        console.warn(
          `Fallback strategy ${strategy.name} failed. Trying next strategy.`
        );
        // Continue to the next fallback
      }
    }

    // 3. All strategies failed
    throw new Error(
      `Service degradation policy failed: Primary call failed and all ${
        strategies.length
      } fallback strategies failed.`
    );
  }
}