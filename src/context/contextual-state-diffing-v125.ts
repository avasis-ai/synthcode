import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ContextualDiff {
  stateDiff: Record<string, any>;
  intentDiff: {
    from: string | null;
    to: string | null;
    changed: boolean;
  };
  goalDiff: {
    from: string | null;
    to: string | null;
    changed: boolean;
  };
}

export interface AgentContext {
  state: Record<string, unknown>;
  intent: string | null;
  goal: string | null;
  messages: Message[];
}

class ContextualStateDiffer {
  private readonly KEY_INTENT = "intent";
  private readonly KEY_GOAL = "goal";

  private deepDiff(
    a: Record<string, unknown>,
    b: Record<string, unknown>
  ): Record<string, any> {
    const diff: Record<string, any> = {};
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const valA = a[key];
      const valB = b[key];

      if (typeof valA !== 'object' || valA === null || typeof valB !== 'object' || valB === null) {
        if (valA !== valB) {
          diff[key] = { from: valA, to: valB };
        }
        continue;
      }

      if (Array.isArray(valA) && Array.isArray(valB)) {
        if (JSON.stringify(valA) !== JSON.stringify(valB)) {
          diff[key] = { from: valA, to: valB };
        }
        continue;
      }

      if (typeof valA === 'object' && valA !== null && typeof valB === 'object' && valB !== null) {
        const nestedDiff = this.deepDiff(valA as Record<string, unknown>, valB as Record<string, unknown>);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else if (valA !== valB) {
        diff[key] = { from: valA, to: valB };
      }
    }
    return diff;
  }

  private diffContext(
    from: AgentContext,
    to: AgentContext
  ): ContextualDiff {
    const stateDiff = this.deepDiff(from.state, to.state);

    const intentDiff: { from: string | null; to: string | null; changed: boolean } = {
      from: from.intent,
      to: to.intent,
      changed: from.intent !== to.intent,
    };

    const goalDiff: { from: string | null; to: string | null; changed: boolean } = {
      from: from.goal,
      to: to.goal,
      changed: from.goal !== to.goal,
    };

    return {
      stateDiff,
      intentDiff,
      goalDiff,
    };
  }
}

export const calculateContextualDiff = (
  fromContext: AgentContext,
  toContext: AgentContext
): ContextualDiff => {
  return new ContextualStateDiffer().diffContext(fromContext, toContext);
};