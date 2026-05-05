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
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export interface StateContext {
  messages: Message[];
  history: LoopEvent[];
  resourceUsage: Record<string, number>;
  lastUpdateTime: number;
}

export interface TemporalResourceConstraints {
  maxCpuUsage: number;
  maxMemoryUsage: number;
  timeWindowMs: number;
}

export interface StateDiffPayload {
  diff: Record<string, any>;
  driftScore: number;
  isSignificantDrift: boolean;
  details: {
    resourceChanges: Record<string, { oldValue: any; newValue: any; weight: number }>;
    temporalChanges: { field: string; old: any; new: any; weight: number }[];
  };
}

export class ContextualStateDiffingV129Service {
  private readonly WEIGHT_RESOURCE_CHANGE = 0.5;
  private readonly WEIGHT_TEMPORAL_CHANGE = 0.3;
  private readonly WEIGHT_MESSAGE_CHANGE = 0.2;

  diff(
    currentState: StateContext,
    previousState: StateContext,
    constraints: TemporalResourceConstraints
  ): StateDiffPayload {
    const resourceDiff = this.diffResourceUsage(
      currentState.resourceUsage,
      previousState.resourceUsage
    );

    const temporalDiff = this.diffTemporal(
      currentState.lastUpdateTime,
      previousState.lastUpdateTime,
      constraints.timeWindowMs
    );

    const messageDiff = this.diffMessages(
      currentState.messages,
      previousState.messages
    );

    const driftScore = this.calculateDriftScore(
      resourceDiff,
      temporalDiff,
      messageDiff
    );

    const isSignificantDrift = driftScore > 1.5;

    return {
      diff: {
        resourceUsage: resourceDiff,
        messages: messageDiff,
        lastUpdateTime: currentState.lastUpdateTime,
      },
      driftScore: parseFloat(driftScore.toFixed(4)),
      isSignificantDrift: isSignificantDrift,
      details: {
        resourceChanges: resourceDiff,
        temporalChanges: temporalDiff,
      },
    };
  }

  private diffResourceUsage(
    current: Record<string, number>,
    previous: Record<string, number>
  ): Record<string, { oldValue: number; newValue: number; weight: number }> {
    const diff: Record<string, { oldValue: number; newValue: number; weight: number }> = {};
    const allKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);

    for (const key of allKeys) {
      const oldValue = previous[key] ?? 0;
      const newValue = current[key] ?? 0;

      if (oldValue !== newValue) {
        let weight = 1.0;
        if (key.includes("cpu") || key.includes("memory")) {
          weight = this.WEIGHT_RESOURCE_CHANGE;
        }
        diff[key] = { oldValue, newValue, weight };
      }
    }
    return diff;
  }

  private diffTemporal(
    current: number,
    previous: number,
    windowMs: number
  ): { field: string; old: any; new: any; weight: number }[] {
    const changes: { field: string; old: any; new: any; weight: number }[] = [];

    if (Math.abs(current - previous) > 100) {
      changes.push({
        field: "lastUpdateTime",
        old: previous,
        new: current,
        weight: this.WEIGHT_TEMPORAL_CHANGE,
      });
    }

    if (Math.abs(windowMs - 0) > 1000) {
      changes.push({
        field: "timeWindowMs",
        old: 0,
        new: windowMs,
        weight: this.WEIGHT_TEMPORAL_CHANGE * 0.5,
      });
    }

    return changes;
  }

  private diffMessages(
    current: Message[],
    previous: Message[]
  ): Message[] {
    if (current.length !== previous.length) {
      return [...current];
    }

    const diff: Message[] = [];
    for (let i = 0; i < current.length; i++) {
      const currentMsg = current[i];
      const previousMsg = previous[i];

      if (this.areMessagesDifferent(currentMsg, previousMsg)) {
        diff.push(currentMsg);
      }
    }
    return diff;
  }

  private areMessagesDifferent(
    current: Message,
    previous: Message
  ): boolean {
    if (JSON.stringify(current) !== JSON.stringify(previous)) {
      return true;
    }
    return false;
  }

  private calculateDriftScore(
    resourceDiff: Record<string, { oldValue: number; newValue: number; weight: number }>,
    temporalDiff: { field: string; old: any; new: any; weight: number }[],
    messageDiff: Message[]
  ): number {
    let score = 0;

    Object.values(resourceDiff).forEach((diff) => {
      score += diff.weight * Math.abs(diff.newValue - diff.oldValue) / 100;
    });

    temporalDiff.forEach((diff) => {
      score += diff.weight * Math.abs(diff.new as number - diff.old as number) / 100;
    });

    score += messageDiff.length * this.WEIGHT_MESSAGE_CHANGE;

    return score;
  }
}