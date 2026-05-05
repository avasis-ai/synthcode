import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface StatePayload {
  data: Record<string, unknown>;
}

export interface ResourceMetrics {
  cpu_cycles: number;
  memory_usage_kb: number;
  network_bytes: number;
}

export interface TemporalConstraint {
  timestamp: number;
  duration_ms: number;
}

export interface TemporalResourceConstraint extends StatePayload {
  temporal: TemporalConstraint;
  resources: ResourceMetrics;
}

export interface StateDiffReport {
  structuralDiff: Record<string, unknown>;
  temporalDiff: {
    constraintA: TemporalConstraint;
    constraintB: TemporalConstraint;
    timeDeltaMs: number;
    resourceDelta: {
      cpu_cycles: number;
      memory_usage_kb: number;
      network_bytes: number;
    };
  };
  isSignificantChange: boolean;
}

export class ContextualStateDiffingV127 {
  private readonly SIGNIFICANCE_THRESHOLD_MS = 5000;
  private readonly RESOURCE_THRESHOLD_KB = 1024;

  private calculateStructuralDiff(stateA: StatePayload, stateB: StatePayload): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    const keysA = Object.keys(stateA.data);
    const keysB = Object.keys(stateB.data);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const valA = stateA.data[key];
      const valB = stateB.data[key];

      if (valA === undefined && valB !== undefined) {
        diff[key] = { added: valB };
      } else if (valA !== undefined && valB === undefined) {
        diff[key] = { removed: valA };
      } else if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
        if (Array.isArray(valA) && Array.isArray(valB)) {
          const arrayDiff: unknown[] = [];
          const maxLength = Math.max(valA.length, valB.length);
          for (let i = 0; i < maxLength; i++) {
            if (i < valA.length && i < valB.length) {
              if (JSON.stringify(valA[i]) !== JSON.stringify(valB[i])) {
                arrayDiff.push({ index: i, changed: true });
              }
            } else if (i < valA.length) {
              arrayDiff.push({ index: i, removed: true });
            } else {
              arrayDiff.push({ index: i, added: true });
            }
          }
          diff[key] = arrayDiff.length > 0 ? arrayDiff : undefined;
        } else if (typeof valA === 'object' && typeof valB === 'object') {
          const nestedDiff = this.calculateStructuralDiff({ data: valA }, { data: valB });
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff;
          }
        } else if (valA !== valB) {
          diff[key] = { changed: true, oldValue: valA, newValue: valB };
        }
      } else if (valA !== valB) {
        diff[key] = { changed: true, oldValue: valA, newValue: valB };
      }
    }
    return diff;
  }

  private calculateResourceDelta(metricsA: ResourceMetrics, metricsB: ResourceMetrics): {
    cpu_cycles: number;
    memory_usage_kb: number;
    network_bytes: number;
  } {
    return {
      cpu_cycles: Math.abs(metricsB.cpu_cycles - metricsA.cpu_cycles),
      memory_usage_kb: Math.abs(metricsB.memory_usage_kb - metricsA.memory_usage_kb),
      network_bytes: Math.abs(metricsB.network_bytes - metricsA.network_bytes),
    };
  }

  public calculateDiff(
    stateA: TemporalResourceConstraint,
    stateB: TemporalResourceConstraint
  ): StateDiffReport {
    const structuralDiff = this.calculateStructuralDiff(
      { data: stateA.data },
      { data: stateB.data }
    );

    const timeDeltaMs = Math.abs(stateB.temporal.timestamp - stateA.temporal.timestamp);

    const resourceDelta = this.calculateResourceDelta(
      stateA.resources,
      stateB.resources
    );

    const isSignificantChange =
      timeDeltaMs > this.SIGNIFICANCE_THRESHOLD_MS ||
      resourceDelta.memory_usage_kb > this.RESOURCE_THRESHOLD_KB;

    return {
      structuralDiff,
      temporalDiff: {
        constraintA: stateA.temporal,
        constraintB: stateB.temporal,
        timeDeltaMs: timeDeltaMs,
        resourceDelta: resourceDelta,
      },
      isSignificantChange,
    };
  }
}