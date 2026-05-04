import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ResourceMetrics {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  networkLatencyMs: number;
}

export interface TemporalMetadata {
  timestampMs: number;
  operationDurationMs: number;
}

export interface ContextualPayload<T> {
  state: T;
  metadata: {
    temporal: TemporalMetadata;
    resources: ResourceMetrics;
  };
}

export interface ResourceDiff {
  metric: keyof ResourceMetrics;
  previousValue: number;
  currentValue: number;
  change: number;
  percentageChange: number;
}

export interface ContextualDiffReport {
  stateDiff: {
    path: string;
    oldValue: any;
    newValue: any;
    diffType: "value_change" | "structure_change";
  }[];
  resourceDiffs: ResourceDiff[];
  temporalObservations: {
    observation: string;
    severity: "low" | "medium" | "high";
  }[];
  summary: string;
}

type StateDiffFunction<T> = (
  prevState: ContextualPayload<T>
) => ContextualDiffReport;

export class ContextualStateDiffer {
  private readonly resourceThresholds: {
    [key: string]: {
      warning: number;
      critical: number;
    };
  };

  constructor(resourceThresholds: {
    [key: string]: {
      warning: number;
      critical: number;
    };
  } = {}) {
    this.resourceThresholds = resourceThresholds;
  }

  private calculateResourceDiffs(
    prevState: ContextualPayload<any>,
    currentState: ContextualPayload<any>
  ): ResourceDiff[] {
    const prev = prevState.metadata.resources;
    const curr = currentState.metadata.resources;
    const diffs: ResourceDiff[] = [];

    const metrics: (keyof ResourceMetrics)[] = ["cpuUsagePercent", "memoryUsageBytes", "networkLatencyMs"];

    for (const metric of metrics) {
      const prevVal = prev[metric];
      const currVal = curr[metric];
      const change = currVal - prevVal;
      const percentageChange = prevVal === 0 ? (currVal === 0 ? 0 : Infinity) : (change / prevVal) * 100;

      diffs.push({
        metric,
        previousValue: prevVal,
        currentValue: currVal,
        change: change,
        percentageChange: parseFloat(percentageChange.toFixed(2)),
      });
    }
    return diffs;
  }

  private analyzeTemporalObservations(
    prevState: ContextualPayload<any>,
    currentState: ContextualPayload<any>
  ): {
    observation: string;
    severity: "low" | "medium" | "high";
  }[] {
    const prevMeta = prevState.metadata.temporal;
    const currMeta = currentState.metadata.temporal;
    const observations: {
      observation: string;
      severity: "low" | "medium" | "high";
    }[] = [];

    const durationChange = Math.abs(currMeta.operationDurationMs - prevMeta.operationDurationMs);
    const timeRatio = currMeta.operationDurationMs / Math.max(1, prevMeta.operationDurationMs);

    if (timeRatio > 2.0) {
      observations.push({
        observation: `Operation duration increased significantly (${timeRatio.toFixed(1)}x). Potential bottleneck detected.`,
        severity: "medium",
      });
    } else if (durationChange > 500 && timeRatio > 1.5) {
      observations.push({
        observation: `Operation duration increased by ${durationChange}ms, suggesting increased complexity or load.`,
        severity: "low",
      });
    }

    return observations;
  }

  private analyzeResourceObservations(
    resourceDiffs: ResourceDiff[]
  ): {
    observation: string;
    severity: "low" | "medium" | "high";
  }[] {
    const observations: {
      observation: string;
      severity: "low" | "medium" | "high";
    }[] = [];

    for (const diff of resourceDiffs) {
      const metricKey = diff.metric as keyof typeof this.resourceThresholds;
      if (!metricKey) continue;

      const thresholds = this.resourceThresholds[metricKey];
      if (!thresholds) continue;

      const currentVal = diff.currentValue;

      if (currentVal > thresholds.critical) {
        observations.push({
          observation: `${metricKey} exceeded critical threshold (${currentVal.toFixed(2)} > ${thresholds.critical}). Immediate attention required.`,
          severity: "high",
        });
      } else if (currentVal > thresholds.warning) {
        observations.push({
          observation: `${metricKey} is elevated (${currentVal.toFixed(2)} > ${thresholds.warning}). Monitoring recommended.`,
          severity: "medium",
        });
      }
    }
    return observations;
  }

  public diff(
    prevState: ContextualPayload<any>,
    currentState: ContextualPayload<any>
  ): ContextualDiffReport {
    const stateDiff: any[] = [];
    const resourceDiffs = this.calculateResourceDiffs(prevState, currentState);
    const temporalObservations = this.analyzeTemporalObservations(prevState, currentState);
    const resourceObservations = this.analyzeResourceObservations(resourceDiffs);

    // Simple state comparison (deep equality check placeholder)
    const stateComparison: any[] = [];
    const stateA = prevState.state;
    const stateB = currentState.state;

    if (JSON.stringify(stateA) !== JSON.stringify(stateB)) {
      stateComparison.push({
        path: "state",
        oldValue: stateA,
        newValue: stateB,
        diffType: "value_change",
      });
    }

    const summary = `State comparison complete. Found ${stateComparison.length} state differences, ${resourceDiffs.length} resource metrics analyzed, and ${temporalObservations.length + resourceObservations.length} contextual observations.`;

    return {
      stateDiff: stateComparison,
      resourceDiffs: resourceDiffs,
      temporalObservations: temporalObservations,
      summary: summary,
    };
  }
}