import { Message, ToolUseBlock } from "./types";

export type PolicyResult = {
  allowed: boolean;
  reason: string;
  newState: PolicyState;
};

export interface UsageQuota {
  max_calls_in_session: number;
  total_cost_over_session: number;
  allowed_combinations: {
    combination: string[];
    max_count: number;
  }[];
}

export interface PolicyRule {
  name: string;
  description: string;
  quota: UsageQuota;
  check(currentState: PolicyState, toolUse: ToolUseBlock, context: { messageHistory: Message[] }): { allowed: boolean; reason: string; newState: PolicyState };
}

export interface PolicyState {
  session_id: string;
  call_count: number;
  total_cost: number;
  last_tool_uses: { tool_name: string; timestamp: number }[];
  combination_counts: Record<string, number>;
}

export class StatefulToolUsagePolicyEngineV4 {
  private stateStore: Map<string, PolicyState>;
  private rules: PolicyRule[];

  constructor(initialRules: PolicyRule[]) {
    this.stateStore = new Map<string, PolicyState>();
    this.rules = initialRules;
  }

  private initializeState(sessionId: string): PolicyState {
    return {
      session_id: sessionId,
      call_count: 0,
      total_cost: 0,
      last_tool_uses: [],
      combination_counts: {},
    };
  }

  private getState(sessionId: string): PolicyState {
    if (!this.stateStore.has(sessionId)) {
      this.stateStore.set(sessionId, this.initializeState(sessionId));
    }
    return this.stateStore.get(sessionId)!;
  }

  private updateState(sessionId: string, newState: PolicyState): void {
    this.stateStore.set(sessionId, newState);
  }

  public checkUsage(
    sessionId: string,
    toolUse: ToolUseBlock,
    context: { messageHistory: Message[] }
  ): PolicyResult {
    const currentState = this.getState(sessionId);
    let workingState = { ...currentState };
    let finalResult: PolicyResult = {
      allowed: true,
      reason: "Usage permitted.",
      newState: { ...currentState }
    };

    for (const rule of this.rules) {
      const ruleCheck = rule.check(currentState, toolUse, context);

      if (!ruleCheck.allowed) {
        return {
          allowed: false,
          reason: `Policy violation by rule '${rule.name}': ${ruleCheck.reason}`,
          newState: currentState
        };
      }

      // If allowed, update the working state based on the rule's transition
      workingState = ruleCheck.newState;
    }

    // If all rules pass, update the main state store
    this.updateState(sessionId, workingState);

    return {
      allowed: true,
      reason: "All usage policies satisfied.",
      newState: workingState
    };
  }
}