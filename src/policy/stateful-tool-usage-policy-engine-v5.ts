import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface StateContext {
  history: Message[];
  sessionStartTime: number;
  toolUsageCounts: Record<string, { count: number; lastUsed: number }>;
  contextKeywords: Set<string>;
}

export enum PolicyAction {
  ALLOW = "ALLOW",
  DENY = "DENY",
  WARN = "WARN",
}

export interface PolicyResult {
  action: PolicyAction;
  message: string;
  stateAdjustment?: (context: StateContext) => StateContext;
}

export interface PolicyRule {
  targetToolName: string;
  condition: (context: StateContext) => boolean;
  onMatch: (context: StateContext) => {
    action: PolicyAction;
    message: string;
    adjustment?: (context: StateContext) => StateContext;
  };
}

export class StatefulToolUsagePolicyEngineV5 {
  private readonly timeWindowMs: number;

  constructor(timeWindowMs: number = 5 * 60 * 1000) {
    this.timeWindowMs = timeWindowMs;
  }

  private getRecentUsage(context: StateContext, toolName: string): { count: number; lastUsed: number } | null {
    const usage = context.toolUsageCounts[toolName];
    if (!usage) {
      return null;
    }
    const timeElapsed = Date.now() - usage.lastUsed;
    if (timeElapsed > this.timeWindowMs) {
      return null;
    }
    return usage;
  }

  public checkPolicy(rule: PolicyRule, context: StateContext): PolicyResult {
    if (!rule.targetToolName) {
      return { action: PolicyAction.ALLOW, message: "No target tool specified." };
    }

    const recentUsage = this.getRecentUsage(context, rule.targetToolName);

    if (rule.condition(context)) {
      const matchResult = rule.onMatch(context);
      return {
        action: matchResult.action,
        message: matchResult.message,
        stateAdjustment: matchResult.adjustment,
      };
    }

    return { action: PolicyAction.ALLOW, message: "Policy condition not met. Allowing usage." };
  }

  public evaluateAndAdjust(
    rule: PolicyRule,
    context: StateContext,
    toolName: string
  ): { result: PolicyResult; newContext: StateContext } {
    const initialContext = {
      ...context,
      toolUsageCounts: {
        ...context.toolUsageCounts,
        [toolName]: {
          count: 1,
          lastUsed: Date.now(),
        },
      },
    };

    const result = this.checkPolicy(rule, initialContext);

    let newContext = initialContext;
    if (result.stateAdjustment) {
      newContext = result.stateAdjustment(initialContext);
    }

    return { result, newContext };
  }
}