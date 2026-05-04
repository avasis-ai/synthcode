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

export interface CausalDiffPayload {
  diff: Record<string, any>;
  causal_context: {
    preceding_event_type: string | null;
    temporal_ordering_violation: boolean;
    causal_dependency_change: boolean;
  };
}

export class ContextualStateDiffingV114 {
  private readonly stateKey: string;

  constructor(stateKey: string) {
    this.stateKey = stateKey;
  }

  private calculateStructuralDiff(oldState: any, newState: any): Record<string, any> {
    const diff: Record<string, any> = {};
    for (const key in newState) {
      if (Object.prototype.hasOwnProperty.call(newState, key)) {
        if (!Object.prototype.hasOwnProperty.call(oldState, key) || oldState[key] !== newState[key]) {
          diff[key] = {
            old: oldState[key],
            new: newState[key],
            changed: true,
          };
        }
      }
    }
    return diff;
  }

  private analyzeCausality(oldState: any, newState: any): {
    preceding_event_type: string | null;
    temporal_ordering_violation: boolean;
    causal_dependency_change: boolean;
  } {
    const lastMessageOld = oldState.messages?.[oldState.messages.length - 1];
    const lastMessageNew = newState.messages?.[newState.messages.length - 1];

    let precedingEventType: string | null = null;
    if (lastMessageOld) {
      if (lastMessageOld.role === "user") {
        precedingEventType = "user";
      } else if (lastMessageOld.role === "assistant") {
        precedingEventType = "assistant";
      } else if (lastMessageOld.role === "tool") {
        precedingEventType = "tool";
      }
    }

    let temporalViolation = false;
    let causalChange = false;

    if (lastMessageOld && lastMessageNew) {
      const oldRole = (lastMessageOld as any).role;
      const newRole = (lastMessageNew as any).role;

      // Simple heuristic for causal change: User -> Tool -> User is different from User -> User
      if (oldRole === "user" && newRole === "user") {
        // No change in expected flow
      } else if (oldRole === "assistant" && newRole === "user") {
        // Expected flow (Assistant response followed by User input)
      } else if (oldRole === "user" && newRole === "tool") {
        // Potential causal shift (User input immediately followed by tool result)
        causalChange = true;
      }
    }

    return {
      preceding_event_type: precedingEventType,
      temporal_ordering_violation: temporalViolation,
      causal_dependency_change: causalChange,
    };
  }

  public calculateCausalDiff(oldState: any, newState: any): CausalDiffPayload {
    const structuralDiff = this.calculateStructuralDiff(oldState, newState);
    const causality = this.analyzeCausality(oldState, newState);

    const payload: CausalDiffPayload = {
      diff: structuralDiff,
      causal_context: {
        preceding_event_type: causality.preceding_event_type,
        temporal_ordering_violation: causality.temporal_ordering_violation,
        causal_dependency_change: causality.causal_dependency_change,
      },
    };

    return payload;
  }
}