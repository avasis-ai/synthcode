export type Context = Record<string, any>;

export type Operator = "equals" | "greaterThan" | "lessThan" | "contains";

export interface FlowRule {
  name: string;
  weight: number;
  criteria: {
    contextKey: string;
    operator: Operator;
    threshold?: any;
  };
  nextAction: {
    type: "tool_id" | "module_name";
    value: string;
  };
}

export class ContextualFlowRouter {
  private rules: FlowRule[];

  constructor(rules: FlowRule[]) {
    this.rules = rules;
  }

  private evaluateCondition(context: Context, criteria: { contextKey: string; operator: Operator; threshold?: any }): boolean {
    const contextValue = context[criteria.contextKey];
    const threshold = criteria.threshold;

    if (contextValue === undefined) {
      return false;
    }

    switch (criteria.operator) {
      case "equals":
        return contextValue === threshold;
      case "greaterThan":
        return typeof contextValue === 'number' && typeof threshold === 'number' && contextValue > threshold;
      case "lessThan":
        return typeof contextValue === 'number' && typeof threshold === 'number' && contextValue < threshold;
      case "contains":
        if (typeof contextValue === 'string' && typeof threshold === 'string') {
          return contextValue.includes(threshold);
        }
        return false;
      default:
        return false;
    }
  }

  private calculateScore(context: Context, rule: FlowRule): number {
    const match = this.evaluateCondition(context, rule.criteria);
    return match ? rule.weight : 0;
  }

  public determineNextAction(context: Context): { action: { type: "tool_id" | "module_name"; value: string }; score: number } | null {
    let bestMatch: { action: { type: "tool_id" | "module_name"; value: string }; score: number } | null = null;
    let maxScore = -1;

    for (const rule of this.rules) {
      const score = this.calculateScore(context, rule);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = { action: { type: "tool_id" | "module_name"; value: rule.nextAction.value }, score };
      }
    }

    return bestMatch && maxScore > 0 ? bestMatch : null;
  }
}

export { ContextualFlowRouter };