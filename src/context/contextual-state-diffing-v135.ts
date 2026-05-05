import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface TemporalResourceConstraint {
  timeDecayFactor: number;
  memoryUsageThreshold: number;
  cpuLoadFactor: number;
}

export interface ContextualStateDiff {
  diff: Record<string, any>;
  temporalScore: number;
  resourceImpact: {
    memory: number;
    cpu: number;
  };
}

export class ContextualStateDiffingV135Service {
  private readonly constraints: TemporalResourceConstraint;

  constructor(constraints: TemporalResourceConstraint) {
    this.constraints = constraints;
  }

  private calculateTemporalScore(currentState: Message[], newState: Message[]): number {
    const decay = this.constraints.timeDecayFactor;
    let score = 0;
    const minLength = Math.min(currentState.length, newState.length);

    for (let i = 0; i < minLength; i++) {
      const oldMsg = currentState[i];
      const newMsg = newState[i];

      if (oldMsg.role !== newMsg.role) {
        score += 1.0;
      } else if (oldMsg.role === "user" && oldMsg.content !== newMsg.content) {
        score += 0.8 * decay;
      } else if (oldMsg.role === "assistant" && oldMsg.content !== newMsg.content) {
        score += 0.6 * decay;
      }
    }
    return score;
  }

  private calculateResourceImpact(currentState: Message[], newState: Message[]): { memory: number; cpu: number } {
    const baseImpact = 0.1;
    const diffCount = Math.abs(currentState.length - newState.length);

    const memory = baseImpact + (diffCount * 0.05) + (this.constraints.memoryUsageThreshold * 0.1);
    const cpu = baseImpact + (diffCount * 0.03) + (this.constraints.cpuLoadFactor * 0.1);

    return { memory: Math.min(memory, 1.0), cpu: Math.min(cpu, 1.0) };
  }

  public diff(currentState: Message[], newState: Message[]): ContextualStateDiff {
    const temporalScore = this.calculateTemporalScore(currentState, newState);
    const resourceImpact = this.calculateResourceImpact(currentState, newState);

    const diff: Record<string, any> = {
      messageCountChange: Math.abs(currentState.length - newState.length),
      contentChanges: this.detectContentChanges(currentState, newState),
    };

    return {
      diff,
      temporalScore: temporalScore,
      resourceImpact: resourceImpact,
    };
  }

  private detectContentChanges(currentState: Message[], newState: Message[]): Record<string, any> {
    const changes: Record<string, any> = {
      user: [],
      assistant: [],
      tool: [],
    };

    const minLength = Math.min(currentState.length, newState.length);

    for (let i = 0; i < minLength; i++) {
      const oldMsg = currentState[i];
      const newMsg = newState[i];

      if (oldMsg.role !== newMsg.role) continue;

      if (oldMsg.role === "user") {
        if (oldMsg.content !== newMsg.content) {
          changes.user.push({ index: i, old: oldMsg.content, new: newMsg.content });
        }
      } else if (oldMsg.role === "assistant") {
        if (oldMsg.content !== newMsg.content) {
          changes.assistant.push({ index: i, old: oldMsg.content, new: newMsg.content });
        }
      } else if (oldMsg.role === "tool") {
        if (oldMsg.content !== newMsg.content) {
          changes.tool.push({ index: i, old: oldMsg.content, new: newMsg.content });
        }
      }
    }
    return changes;
  }
}