import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface ResourceConstraints {
  maxCpuUsage?: number;
  maxMemoryUsage?: number;
  maxExecutionTimeMs?: number;
}

export interface ConstraintImpact {
  cpuOverrun?: number;
  memoryOverrun?: number;
  timeViolationMs?: number;
}

export interface DiffReport {
  diff: Record<string, any>;
  impact: ConstraintImpact;
  isSignificant: boolean;
}

export class TemporalResourceAwareDiffCalculator {
  private constraints: ResourceConstraints;

  constructor(constraints: ResourceConstraints = {}) {
    this.constraints = constraints;
  }

  private calculateImpact(currentState: any, previousState: any): ConstraintImpact {
    const impact: ConstraintImpact = {};

    if (this.constraints.maxCpuUsage !== undefined) {
      // Placeholder logic: Simulate CPU impact based on state complexity change
      const complexityChange = Math.abs(JSON.stringify(currentState).length - JSON.stringify(previousState).length) / 1000;
      impact.cpuOverrun = complexityChange * 0.1;
    }

    if (this.constraints.maxMemoryUsage !== undefined) {
      // Placeholder logic: Simulate Memory impact
      const sizeDiff = Math.abs(Object.keys(currentState).length - Object.keys(previousState).length);
      impact.memoryOverrun = sizeDiff * 10;
    }

    if (this.constraints.maxExecutionTimeMs !== undefined) {
      // Placeholder logic: Simulate Time impact
      const timeDelta = Math.abs(Date.now() - (previousState?.timestamp || Date.now()));
      impact.timeViolationMs = Math.max(0, timeDelta - this.constraints.maxExecutionTimeMs);
    }

    return impact;
  }

  private compareBlocks(current: ContentBlock, previous: ContentBlock): Record<string, any> {
    if (typeof current !== typeof previous) {
      return { typeMismatch: true };
    }

    if (current.type === "text" && typeof (current as TextBlock).text !== undefined) {
      const currentText = (current as TextBlock).text;
      const previousText = (previous as TextBlock).text;
      if (currentText !== previousText) {
        return { textChanged: true, oldValue: previousText, newValue: currentText };
      }
    } else if (current.type === "tool_use" && typeof (current as ToolUseBlock).id !== undefined) {
      const currentTool = current as ToolUseBlock;
      const previousTool = previous as ToolUseBlock;
      if (currentTool.id !== previousTool.id || JSON.stringify(currentTool.input) !== JSON.stringify(previousTool.input)) {
        return { toolUseChanged: true, id: currentTool.id, inputChanged: true };
      }
    }
    return { unchanged: true };
  }

  public calculateAdvancedDiff(
    currentState: any,
    previousState: any,
    constraints: ResourceConstraints = this.constraints
  ): DiffReport {
    const diff: Record<string, any> = {};
    let hasStructuralChange = false;

    // 1. State structure comparison (Simplified for demonstration)
    if (typeof currentState !== 'object' || typeof previousState !== 'object') {
      diff['root'] = { typeMismatch: true };
      hasStructuralChange = true;
    } else {
      // Assuming state is an array of messages for deep comparison
      const currentMessages = Array.isArray(currentState) ? currentState : [currentState];
      const previousMessages = Array.isArray(previousState) ? previousState : [previousState];

      const messageDiffs: Record<string, any> = {};
      const minLength = Math.min(currentMessages.length, previousMessages.length);

      for (let i = 0; i < minLength; i++) {
        const currentMsg = currentMessages[i];
        const previousMsg = previousMessages[i];

        if (currentMsg && previousMsg) {
          const msgDiff = {
            messages: {
              [i]: {
                contentDiff: this.compareBlocks(
                  (currentMsg as any).contentBlocks?.[0] || currentMsg,
                  (previousMsg as any).contentBlocks?.[0] || previousMsg
                ),
              },
            },
          };
          messageDiffs[`message_${i}`] = msgDiff;
        }
      }
      diff['messages'] = messageDiffs;
    }

    // 2. Calculate Impact
    const impact = this.calculateImpact(currentState, previousState);

    // 3. Determine Significance
    const isSignificant = hasStructuralChange ||
      impact.cpuOverrun?.[0] > 0.5 ||
      impact.memoryOverrun?.[0] > 100 ||
      impact.timeViolationMs?.[0] > 500;

    return {
      diff: diff,
      impact: impact,
      isSignificant: isSignificant,
    };
  }
}