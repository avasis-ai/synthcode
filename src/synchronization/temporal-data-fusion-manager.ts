import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, LoopEvent } from "./types";

interface FusionInput {
  payload: Record<string, unknown>;
  source: string;
  arrivalTime: Date;
  validityWindowMs: number;
}

interface SynchronizedContext {
  timestamp: Date;
  data: Record<string, unknown>;
  sourcesUsed: string[];
}

class TemporalDataFusionManager {
  constructor() {}

  private isInputValid(input: FusionInput, targetTime: Date): boolean {
    const validityEnd = new Date(input.arrivalTime.getTime() + input.validityWindowMs);
    return targetTime >= new Date(input.arrivalTime.getTime()) && targetTime <= validityEnd;
  }

  private resolveConflict(key: string, values: Record<string, unknown>[]): unknown {
    if (values.length === 0) {
      return undefined;
    }

    // Simple conflict resolution policy: Prioritize the value from the source that arrived earliest.
    // In a real system, this would involve weighted averaging, consensus algorithms, or specific domain logic.
    let bestValue: unknown = values[0][key];
    let earliestSource = values[0].source;

    for (let i = 1; i < values.length; i++) {
      const currentValue = values[i];
      const currentSource = currentValue.source;

      // Assuming the source name can be used to determine priority or simply taking the first one encountered
      // if the conflict resolution logic is complex. For simplicity, we'll just take the value from the
      // source that was listed first in the input array (which is often the most reliable).
      // If we needed true temporal conflict resolution, we would need the input arrival time here.
      // Since we only have the payload, we stick to a simple "first-wins" or "most complete" policy.

      // Simple policy: If the current value is an object and the existing value is not, replace it.
      if (typeof bestValue !== 'object' && typeof currentValue[key] === 'object' && currentValue[key] !== null) {
        bestValue = currentValue[key];
      } else if (typeof bestValue === 'object' && typeof currentValue[key] === 'object' && currentValue[key] !== null) {
        // If both are objects, merge them (assuming they are dictionaries)
        if (bestValue !== null && currentValue[key] !== null) {
            const merged: Record<string, unknown> = { ...bestValue, ...currentValue[key] };
            bestValue = merged;
        }
      }
    }
    return bestValue;
  }

  public synchronize(inputs: FusionInput[], targetTime: Date): SynchronizedContext {
    const validInputs = inputs.filter(input => this.isInputValid(input, targetTime));

    if (validInputs.length === 0) {
      return {
        timestamp: targetTime,
        data: {},
        sourcesUsed: [],
      };
    }

    const mergedData: Record<string, unknown> = {};
    const sourcesUsedSet = new Set<string>();

    // 1. Aggregate all data points by key
    const aggregatedPayloads: Record<string, Record<string, unknown>[]> = {};

    for (const input of validInputs) {
      sourcesUsedSet.add(input.source);
      const payload = input.payload;

      for (const key in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          const value = payload[key];
          if (!aggregatedPayloads[key]) {
            aggregatedPayloads[key] = [];
          }
          aggregatedPayloads[key].push({
            source: input.source,
            [key]: value,
          });
        }
      }
    }

    // 2. Resolve conflicts and build the final context
    for (const key in aggregatedPayloads) {
      const values = aggregatedPayloads[key];
      const resolvedValue = this.resolveConflict(key, values);
      mergedData[key] = resolvedValue;
    }

    return {
      timestamp: targetTime,
      data: mergedData,
      sourcesUsed: Array.from(sourcesUsedSet),
    };
  }
}

export { TemporalDataFusionManager };