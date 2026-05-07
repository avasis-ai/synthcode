import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export type InterventionSource = "human" | "system" | "external_api";

export interface Intervention {
  source: InterventionSource;
  proposed_change: Record<string, unknown>;
  priority: number;
  confidence: number;
  message: string;
}

export interface AgentContext {
  history: ContentBlock[];
  current_state: Record<string, unknown>;
  last_action_id: string | null;
}

export class ContextualInterventionManager {
  private readonly MIN_PRIORITY_FOR_INTERVENTION: number;

  constructor(minPriority: number = 0.7) {
    this.MIN_PRIORITY_FOR_INTERVENTION = minPriority;
  }

  receiveIntervention(intervention: Intervention): boolean {
    if (intervention.priority < this.MIN_PRIORITY_FOR_INTERVENTION) {
      return false;
    }
    return true;
  }

  resolveIntervention(context: AgentContext, intervention: Intervention): {
    newState: AgentContext;
    applied: boolean;
    message: string;
  } {
    if (!this.receiveIntervention(intervention)) {
      return {
        newState: context,
        applied: false,
        message: `Intervention rejected: Priority (${intervention.priority.toFixed(2)}) is below the required threshold (${this.MIN_PRIORITY_FOR_INTERVENTION.toFixed(2)}).`,
      };
    }

    const { proposed_change, source, message: interventionMessage } = intervention;

    // 1. Conflict Detection (Simplified: Check if proposed change contradicts current state)
    const isConflict = this.checkForConflict(context.current_state, proposed_change);

    if (isConflict) {
      return {
        newState: context,
        applied: false,
        message: `Conflict detected. The proposed change conflicts with the current context state. Manual review required.`,
      };
    }

    // 2. State Update
    const newState: AgentContext = {
      ...context,
      current_state: {
        ...context.current_state,
        ...proposed_change,
      },
      history: [
        ...context.history,
        {
          type: "text",
          text: `[INTERVENTION RECEIVED from ${source.toUpperCase()}]: ${interventionMessage}`,
        },
      ],
      last_action_id: intervention.source === "system" ? "INTERVENTION_OVERRIDE" : context.last_action_id,
    };

    return {
      newState: newState,
      applied: true,
      message: `Intervention successfully applied from ${source}. Context updated.`,
    };
  }

  private checkForConflict(currentState: Record<string, unknown>, proposedChange: Record<string, unknown>): boolean {
    for (const key in proposedChange) {
      const proposedValue = proposedChange[key];
      const currentValue = currentState[key];

      if (currentValue !== undefined && typeof currentValue === typeof proposedValue && currentValue !== proposedValue) {
        // Simple conflict check: if types match but values differ, assume conflict unless explicitly allowed.
        return true;
      }
    }
    return false;
  }
}