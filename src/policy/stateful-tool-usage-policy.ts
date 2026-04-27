import { Message, ToolUseBlock } from "./types";

export type PolicyResult = {
  allowed: boolean;
  reason: string;
};

export interface ToolUsageHistory {
  messages: Message[];
  toolCallCounts: Record<string, number>;
}

export interface StatefulPolicy {
  name: string;
  evaluate: (
    context: {
      history: Message[];
      currentToolUse: ToolUseBlock;
    },
    history: ToolUsageHistory,
    toolName: string,
    callCount: number
  ) => PolicyResult;
}

export class PolicyEngine {
  private policies: StatefulPolicy[] = [];

  registerPolicy(policy: StatefulPolicy): void {
    this.policies.push(policy);
  }

  evaluatePolicies(
    context: {
      history: Message[];
      currentToolUse: ToolUseBlock;
    },
    history: ToolUsageHistory,
    toolName: string,
    callCount: number
  ): PolicyResult {
    for (const policy of this.policies) {
      const result = policy.evaluate(
        context,
        history,
        toolName,
        callCount
      );
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true, reason: "All stateful policies passed." };
  }
}

export const createStatefulToolUsagePolicyEngine = (): PolicyEngine => {
  const engine = new PolicyEngine();

  // Example Policy: Tool A cannot be called more than 3 times within the last 10 turns if Tool B was called immediately before it.
  const limitedToolUsagePolicy: StatefulPolicy = {
    name: "LimitedToolUsageAfterB",
    evaluate: (
      context: {
        history: Message[];
        currentToolUse: ToolUseBlock;
      },
      history: ToolUsageHistory,
      toolName: string,
      callCount: number
    ): PolicyResult => {
      const lastMessage = context.history[context.history.length - 1];
      const isToolBPreceding =
        lastMessage?.role === "tool" &&
        (lastMessage as any).tool_use_id === "tool_b_id"; // Mock check for Tool B

      if (toolName === "tool_a" && isToolBPreceding) {
        const recentCalls = history.messages.filter(
          (msg) =>
            (msg as any).role === "tool" &&
            (msg as any).tool_use_id.includes("tool_a")
        ).length;

        if (recentCalls >= 3) {
          return {
            allowed: false,
            reason: "Tool A usage limit exceeded (3 times) immediately following Tool B.",
          };
        }
      }
      return { allowed: true, reason: "Policy check passed." };
    },
  };

  engine.registerPolicy(limitedToolUsagePolicy);

  return engine;
};