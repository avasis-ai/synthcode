export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface CognitiveBudget {
  maxLoad: number;
  currentLoad: number;
  history: number[];
}

export class CognitiveBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CognitiveBudgetExceededError";
  }
}

class EstimationService {
  /**
   * Estimates the cognitive load score for a given piece of content or action.
   * Scores are heuristic: synthesis/planning is high, retrieval/simple text is low.
   * @param content The text or description to score.
   * @returns A numerical load score.
   */
  static estimate(content: string): number {
    const lowerContent = content.toLowerCase();
    let score = 1;

    if (lowerContent.includes("synthesize") || lowerContent.includes("plan") || lowerContent.includes("reasoning")) {
      score += 3;
    }
    if (lowerContent.includes("compare") || lowerContent.includes("contrast")) {
      score += 2;
    }
    if (lowerContent.length > 500) {
      score += 1;
    }
    return Math.max(1, score);
  }
}

export class CognitiveLoadManager {
  private budget: CognitiveBudget;

  constructor(initialBudget: CognitiveBudget) {
    this.budget = {
      maxLoad: initialBudget.maxLoad,
      currentLoad: initialBudget.currentLoad,
      history: initialBudget.history || [],
    };
  }

  getBudget(): CognitiveBudget {
    return this.budget;
  }

  /**
   * Checks if adding a new load score exceeds the defined budget.
   * @param newLoad The estimated load of the next step.
   * @returns true if the load is acceptable, false otherwise.
   */
  check(newLoad: number): boolean {
    const projectedLoad = this.budget.currentLoad + newLoad;
    return projectedLoad <= this.budget.maxLoad;
  }

  /**
   * Updates the manager's state after a successful step.
   * @param load The actual load consumed by the step.
   * @returns The updated CognitiveBudget.
   */
  consumeLoad(load: number): CognitiveBudget {
    if (load < 0) {
      throw new Error("Load must be non-negative.");
    }
    this.budget.currentLoad += load;
    this.budget.history.push(load);
    return this.budget;
  }

  /**
   * Intercepts the planning cycle, checks the budget, and adjusts the plan if necessary.
   * @param content The content/prompt being processed.
   * @param maxBudget The maximum allowable load for this specific step.
   * @returns The updated CognitiveBudget.
   * @throws CognitiveBudgetExceededError if the load is too high.
   */
  checkAndAdjust(content: string, maxBudget: number): CognitiveBudget {
    const estimatedLoad = EstimationService.estimate(content);

    if (estimatedLoad > maxBudget) {
      throw new CognitiveBudgetExceededError(
        `Estimated load (${estimatedLoad}) exceeds the allowed budget (${maxBudget}). Suggesting reflection.`
      );
    }

    return this.consumeLoad(estimatedLoad);
  }

  /**
   * Resets the manager's state, typically after a major break or successful completion.
   */
  reset(): CognitiveBudget {
    this.budget = {
      maxLoad: this.budget.maxLoad,
      currentLoad: 0,
      history: [],
    };
    return this.budget;
  }
}

export { CognitiveLoadManager, CognitiveBudgetExceededError, EstimationService };