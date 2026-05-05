import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface StateMetrics {
  timestamp: number;
  cpuUsageMs: number;
  memoryUsageBytes: number;
}

export interface TemporalConstraint {
  maxTimeDeltaMs: number;
  minResourceThreshold: number;
}

export interface StateDiffPayload {
  diff: Record<string, any>;
  temporalViolation: boolean;
  resourceViolation: boolean;
  contextualMessage: string;
}

export class ContextualStateDiffingService {
  private readonly temporalConstraints: TemporalConstraint;

  constructor(temporalConstraints: TemporalConstraint) {
    this.temporalConstraints = temporalConstraints;
  }

  private checkTemporalViolation(
    previousState: any,
    currentState: any,
    metrics: StateMetrics
  ): boolean {
    const timeDelta = metrics.timestamp - (previousState?.metrics?.timestamp || 0);
    return timeDelta > this.temporalConstraints.maxTimeDeltaMs;
  }

  private checkResourceViolation(
    previousState: any,
    currentState: any,
    metrics: StateMetrics
  ): boolean {
    const resourceDelta = metrics.memoryUsageBytes - (previousState?.metrics?.memoryUsageBytes || 0);
    return resourceDelta > this.temporalConstraints.minResourceThreshold;
  }

  private calculateSimpleDiff(previousState: any, currentState: any): Record<string, any> {
    const diff: Record<string, any> = {};
    const keys = new Set([...Object.keys(previousState), ...Object.keys(currentState)]);

    keys.forEach((key) => {
      if (key === "metrics") return;

      const prevValue = previousState[key];
      const currValue = currentState[key];

      if (typeof prevValue === 'object' && prevValue !== null && typeof currValue === 'object' && currValue !== null) {
        if (Array.isArray(prevValue) && Array.isArray(currValue)) {
          if (prevValue.length !== currValue.length) {
            diff[key] = { changed: true, oldLength: prevValue.length, newLength: currValue.length };
          } else {
            const arrayDiff: Record<string, any> = {};
            for (let i = 0; i < prevValue.length; i++) {
              const itemDiff = {
                changed: JSON.stringify(prevValue[i]) !== JSON.stringify(currValue[i]),
                old: prevValue[i],
                new: currValue[i],
              };
              arrayDiff[`${i}`] = itemDiff;
            }
            diff[key] = { changed: Object.values(arrayDiff).some(d => d.changed), diff: arrayDiff };
          }
        } else if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
          diff[key] = { changed: true, old: prevValue, new: currValue };
        }
      } else if (prevValue !== currValue) {
        diff[key] = { changed: true, old: prevValue, new: currValue };
      }
    });
    return diff;
  }

  public calculateDiff(
    previousState: any,
    currentState: any,
    metrics: StateMetrics
  ): StateDiffPayload {
    const simpleDiff = this.calculateSimpleDiff(previousState, currentState);
    const temporalViolation = this.checkTemporalViolation(previousState, currentState, metrics);
    const resourceViolation = this.checkResourceViolation(previousState, currentState, metrics);

    let message = "State updated successfully.";
    if (temporalViolation) {
      message = "WARNING: Temporal constraint violated. State change occurred too quickly or too slowly.";
    }
    if (resourceViolation) {
      message = "WARNING: Resource constraint violated. Significant resource spike detected.";
    }
    if (Object.keys(simpleDiff).length === 0) {
      message = "No significant state changes detected.";
    }

    return {
      diff: simpleDiff,
      temporalViolation: temporalViolation,
      resourceViolation: resourceViolation,
      contextualMessage: message,
    };
  }
}

export { ContextualStateDiffingService };