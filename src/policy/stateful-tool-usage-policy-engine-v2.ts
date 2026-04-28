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

type EnforcementAction = "WARN" | "BLOCK" | "ADJUST_LIMIT";

interface UsageMetrics {
  costBudget: number;
  callCount: number;
  complexityScore: number;
}

export interface PolicyRule {
  toolName: string;
  metrics: UsageMetrics;
  actionThreshold: {
    cost: number;
    calls: number;
    complexity: number;
  };
  defaultAction: EnforcementAction;
}

export interface SessionState {
  globalMetrics: UsageMetrics;
  toolSpecificMetrics: Record<string, UsageMetrics>;
  contextWindowSize: number;
}

export interface PolicyAdjuster {
  adjustState(currentState: SessionState, violation: { rule: PolicyRule; metric: keyof UsageMetrics; value: number }): SessionState;
  adjustState(currentState: SessionState, success: { rule: PolicyRule; metric: keyof UsageMetrics; value: number }): SessionState;
}

export class StatefulToolUsagePolicyEngineV2 {
  private rules: PolicyRule[];
  private adjuster: PolicyAdjuster;

  constructor(rules: PolicyRule[], adjuster: PolicyAdjuster) {
    this.rules = rules;
    this.adjuster = adjuster;
  }

  private calculateProjectedImpact(
    toolName: string,
    input: Record<string, unknown>,
    currentMetrics: UsageMetrics
  ): {
    cost: number;
    calls: number;
    complexity: number;
  } {
    // Simplified projection: Assume cost scales with input size, calls increase by 1, complexity by a fixed amount.
    const inputSizeFactor = Math.max(1, Object.keys(input).length);
    return {
      cost: 0.01 * inputSizeFactor,
      calls: 1,
      complexity: 0.1 * inputSizeFactor,
    };
  }

  public evaluate(
    currentState: SessionState,
    toolCall: { name: string; input: Record<string, unknown> }
  ): {
    allowed: boolean;
    action: EnforcementAction;
    newState: SessionState;
    message: string;
  } {
    const rule = this.rules.find((r) => r.toolName === toolCall.name);
    if (!rule) {
      return {
        allowed: true,
        action: "WARN",
        newState: currentState,
        message: `No specific policy rule found for tool: ${toolCall.name}. Proceeding with caution.`,
      };
    }

    const projectedImpact = this.calculateProjectedImpact(
      toolCall.name,
      toolCall.input,
      currentState.toolSpecificMetrics[toolCall.name] || {
        costBudget: 0,
        callCount: 0,
        complexityScore: 0,
      }
    );

    const currentToolMetrics = currentState.toolSpecificMetrics[toolCall.name] || {
      costBudget: 0,
      callCount: 0,
      complexityScore: 0,
    };

    const projectedCost = currentToolMetrics.costBudget + projectedImpact.cost;
    const projectedCalls = currentToolMetrics.callCount + projectedImpact.calls;
    const projectedComplexity = currentToolMetrics.complexityScore + projectedImpact.complexity;

    let violation: { rule: PolicyRule; metric: keyof UsageMetrics; value: number } | null = null;
    let action: EnforcementAction = "WARN";

    if (projectedCost > rule.actionThreshold.cost) {
      violation = { rule, metric: "costBudget", value: projectedCost };
      action = "WARN";
    } else if (projectedCalls > rule.actionThreshold.calls) {
      violation = { rule, metric: "callCount", value: projectedCalls };
      action = "WARN";
    } else if (projectedComplexity > rule.actionThreshold.complexity) {
      violation = { rule, metric: "complexityScore", value: projectedComplexity };
      action = "WARN";
    }

    let newState = currentState;
    let allowed = true;
    let message = "";

    if (violation) {
      if (action === "WARN") {
        message = `Warning: Projected usage (${action}) for ${toolCall.name} exceeds threshold.`;
      } else {
        message = `Error: Usage for ${toolCall.name} is blocked due to policy violation.`;
        allowed = false;
      }
      newState = this.adjuster.adjustState(currentState, violation);
    } else {
      // Successful projection, update state and potentially adjust based on success
      const successUpdate = { rule, metric: "costBudget", value: projectedCost };
      newState = this.adjuster.adjustState(currentState, successUpdate);
      message = `Usage within policy limits.`;
    }

    return {
      allowed,
      action,
      newState,
      message,
    };
  }
}