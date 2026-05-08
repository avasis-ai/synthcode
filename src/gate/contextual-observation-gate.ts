import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../types.js";

export interface ResourceMetrics {
  latencyMs: number;
  costUnits: number;
  resourceUsageScore: number;
}

export interface PruningStrategy {
  apply(context: Message[], metrics: ResourceMetrics): Message[];
}

export class TimeWindowReducer implements PruningStrategy {
  private maxTimeWindowMinutes: number;

  constructor(maxTimeWindowMinutes: number) {
    this.maxTimeWindowMinutes = maxTimeWindowMinutes;
  }

  apply(context: Message[], metrics: ResourceMetrics): Message[] {
    // Simplified implementation: assumes context messages have a timestamp property for reduction
    // Since the provided Message interface doesn't have a timestamp, we simulate pruning by just returning a subset
    // based on a hypothetical time check.
    if (context.length > 5) {
      return context.slice(1, 5);
    }
    return context;
  }
}

export class SourcePrioritizer implements PruningStrategy {
  private criticalSources: Set<string>;

  constructor(criticalSources: string[]) {
    this.criticalSources = new Set(criticalSources);
  }

  apply(context: Message[], metrics: ResourceMetrics): Message[] {
    // Filters context to only include messages from critical sources
    return context.filter(message => {
      // Assuming we can check the source/role to determine criticality
      if (message.role === "user" && this.criticalSources.has("user")) return true;
      if (message.role === "assistant" && this.criticalSources.has("assistant")) return true;
      return false;
    });
  }
}

export class ObservationGate {
  private metricsSource: (context: Message[]) => ResourceMetrics;
  private pruningStrategy: PruningStrategy;
  private readonly latencyThresholdMs: number;
  private readonly costThresholdUnits: number;

  constructor(
    metricsSource: (context: Message[]) => ResourceMetrics,
    pruningStrategy: PruningStrategy,
    latencyThresholdMs: number = 500,
    costThresholdUnits: number = 0.1
  ) {
    this.metricsSource = metricsSource;
    this.pruningStrategy = pruningStrategy;
    this.latencyThresholdMs = latencyThresholdMs;
    this.costThresholdUnits = costThresholdUnits;
  }

  private checkThresholds(metrics: ResourceMetrics): boolean {
    const isOverBudget = metrics.latencyMs > this.latencyThresholdMs || metrics.costUnits > this.costThresholdUnits;
    return isOverBudget;
  }

  public gateContextualFilter(context: Message[]): Message[] {
    const metrics = this.metricsSource(context);

    if (!this.checkThresholds(metrics)) {
      return context;
    }

    console.warn("Contextual Observation Gate triggered: Performance metrics exceeded thresholds. Applying pruning strategy.");
    
    return this.pruningStrategy.apply(context, metrics);
  }
}