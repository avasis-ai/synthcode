import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ContextualPayload {
  state: any;
  timestamp: number;
  resourceUsage: {
    cpuMs: number;
    memoryBytes: number;
    networkBytes: number;
  };
}

export interface ContextualDiff {
  stateDiff: any;
  temporalDelta: number;
  resourceDelta: {
    cpuMs: number;
    memoryBytes: number;
    networkBytes: number;
  };
  isValid: boolean;
}

export class ContextualStateDiffer {
  private readonly stateHistory: Map<string, ContextualPayload> = new Map();

  private calculateResourceDelta(oldPayload: ContextualPayload, newPayload: ContextualPayload): {
    cpuMs: number;
    memoryBytes: number;
    networkBytes: number;
  } {
    return {
      cpuMs: Math.abs(newPayload.resourceUsage.cpuMs - oldPayload.resourceUsage.cpuMs),
      memoryBytes: Math.abs(newPayload.resourceUsage.memoryBytes - oldPayload.resourceUsage.memoryBytes),
      networkBytes: Math.abs(newPayload.resourceUsage.networkBytes - oldPayload.resourceUsage.networkBytes),
    };
  }

  private calculateTemporalDelta(oldPayload: ContextualPayload, newPayload: ContextualPayload): number {
    return Math.abs(newPayload.timestamp - oldPayload.timestamp);
  }

  private calculateStateDiff(oldState: any, newState: any): any {
    if (!oldState || !newState) {
      return newState;
    }
    const diff: Record<string, any> = {};
    for (const key in newState) {
      if (Object.prototype.hasOwnProperty.call(newState, key)) {
        const newValue = newState[key];
        const oldValue = oldState[key];

        if (typeof newValue === 'object' && newValue !== null && typeof oldValue === 'object' && oldValue !== null) {
          const nestedDiff = this.calculateStateDiff(oldValue, newValue);
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = nestedDiff;
          }
        } else if (newValue !== oldValue) {
          diff[key] = newValue;
        }
      }
    }
    return diff;
  }

  public processContextualDiff(
    currentState: any,
    newContext: ContextualPayload
  ): ContextualDiff {
    const key = JSON.stringify(currentState);

    const oldPayload = this.stateHistory.get(key);

    if (!oldPayload) {
      return {
        stateDiff: currentState,
        temporalDelta: 0,
        resourceDelta: { cpuMs: 0, memoryBytes: 0, networkBytes: 0 },
        isValid: true,
      };
    }

    const stateDiff = this.calculateStateDiff(oldPayload.state, newContext.state);
    const temporalDelta = this.calculateTemporalDelta(oldPayload, newContext);
    const resourceDelta = this.calculateResourceDelta(oldPayload, newContext);

    const isValid = stateDiff !== {} && temporalDelta > 0 && resourceDelta.cpuMs > 0;

    const diff: ContextualDiff = {
      stateDiff,
      temporalDelta,
      resourceDelta,
      isValid,
    };

    this.stateHistory.set(JSON.stringify(newContext.state), {
      state: newContext.state,
      timestamp: newContext.timestamp,
      resourceUsage: newContext.resourceUsage,
    });

    return diff;
  }

  public resetHistory(): void {
    this.stateHistory.clear();
  }
}