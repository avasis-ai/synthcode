export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export type ContentBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "thinking"; thinking: string };

export interface AttentionBudget {
  max_depth: number;
  max_complexity_score: number;
  max_turns: number;
  initial_focus_score: number;
}

export interface FocusLossEvent {
  type: "FocusLossEvent";
  message: string;
  action: "simplify" | "summarize" | "request_intervention";
}

export class AttentionBudgetingManager {
  private budget: AttentionBudget;
  private currentUsage: {
    depth: number;
    complexity: number;
    turns: number;
  };
  private focusScore: number;

  constructor(budget: AttentionBudget) {
    this.budget = budget;
    this.currentUsage = {
      depth: 0,
      complexity: 0,
      turns: 0,
    };
    this.focusScore = budget.initial_focus_score;
  }

  private calculateFocusScore(usage: {
    depth: number;
    complexity: number;
    turns: number;
  }): number {
    const depthPenalty = usage.depth * 0.1;
    const complexityPenalty = usage.complexity * 0.05;
    const turnPenalty = usage.turns * 0.2;
    return Math.max(0, this.budget.initial_focus_score - depthPenalty - complexityPenalty - turnPenalty);
  }

  public recordTurn() {
    this.currentUsage.turns += 1;
    this.focusScore = this.calculateFocusScore(this.currentUsage);
  }

  public recordDepth(depthIncrease: number) {
    this.currentUsage.depth += depthIncrease;
    this.focusScore = this.calculateFocusScore(this.currentUsage);
  }

  public recordComplexity(scoreIncrease: number) {
    this.currentUsage.complexity += scoreIncrease;
    this.focusScore = this.calculateFocusScore(this.currentUsage);
  }

  public checkBudget(
    depthIncrease: number,
    complexityIncrease: number,
    isTurn: boolean
  ): {
    isOverBudget: boolean;
    event: FocusLossEvent | null;
  } {
    const newDepth = this.currentUsage.depth + depthIncrease;
    const newComplexity = this.currentUsage.complexity + complexityIncrease;
    const newTurns = this.currentUsage.turns + (isTurn ? 1 : 0);

    if (newDepth > this.budget.max_depth ||
      newComplexity > this.budget.max_complexity_score ||
      newTurns > this.budget.max_turns) {
      
      const event: FocusLossEvent = {
        type: "FocusLossEvent",
        message: "Attention budget exceeded. Over-analysis detected.",
        action: "simplify",
      };
      return { isOverBudget: true, event };
    }

    // If not over budget, update usage and score
    this.recordDepth(depthIncrease);
    this.recordComplexity(complexityIncrease);
    if (isTurn) {
      this.recordTurn();
    }

    return { isOverBudget: false, event: null };
  }

  public getFocusScore(): number {
    return this.focusScore;
  }
}

export { AttentionBudgetingManager };