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

export interface TemporalResourceConstraint {
  maxTimeDeltaMs: number;
  maxCpuUsageThreshold: number;
  resourceImpactReport: {
    violated: boolean;
    details: string;
  };
}

export interface StateDiff {
  diffedState: any;
  constraintViolation: {
    violated: boolean;
    reason: string;
  };
}

export class ContextualStateDiffer {
  private readonly constraint: TemporalResourceConstraint;

  constructor(constraint: TemporalResourceConstraint) {
    this.constraint = constraint;
  }

  private compareMessages(oldState: Message[], newState: Message[]): {
    diffedState: any;
    constraintViolation: {
      violated: boolean;
      reason: string;
    };
  } {
    const diffedState: Message[] = [];
    let hasConstraintViolation = false;
    let violationReason = "";

    const calculateResourceImpact = (oldMsg: Message, newMsg: Message): {
      impact: number;
      violated: boolean;
      reason: string;
    } => {
      const timeDelta = Math.abs(Date.now() - Date.now()); // Placeholder for actual time calculation
      const cpuUsage = Math.random() * 100; // Placeholder for actual CPU calculation

      const isTimeViolated = timeDelta > this.constraint.maxTimeDeltaMs;
      const isCpuViolated = cpuUsage > this.constraint.maxCpuUsageThreshold;

      if (isTimeViolated || isCpuViolated) {
        hasConstraintViolation = true;
        violationReason = `Resource constraint violated: Time=${isTimeViolated ? 'Exceeded' : 'OK'}, CPU=${isCpuViolated ? 'Exceeded' : 'OK'}.`;
      }

      return {
        impact: timeDelta + cpuUsage,
        violated: isTimeViolated || isCpuViolated,
        reason: violationReason,
      };
    };

    for (let i = 0; i < Math.max(oldState.length, newState.length); i++) {
      const oldMsg = oldState[i];
      const newMsg = newState[i];

      if (!oldMsg && newMsg) {
        diffedState.push(newMsg);
      } else if (oldMsg && !newMsg) {
        diffedState.push({ type: "removed", content: oldMsg });
      } else if (oldMsg && newMsg) {
        const resourceCheck = calculateResourceImpact(oldMsg, newMsg);
        const diffedMessage: Message = { ...newMsg }; // Simplified diffing for structure
        diffedState.push(diffedMessage);
      }
    }

    return {
      diffedState: diffedState,
      constraintViolation: {
        violated: hasConstraintViolation,
        reason: violationReason,
      },
    };
  }

  public calculateDiff(oldState: Message[], newState: Message[]): StateDiff {
    const { diffedState, constraintViolation } = this.compareMessages(oldState, newState);

    return {
      diffedState: diffedState,
      constraintViolation: constraintViolation,
    };
  }
}