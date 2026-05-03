import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock, LoopEvent } from "./types";

export interface ResourceBudget {
  resourceName: string;
  currentUsage: number;
  limit: number;
}

export class ContextualResourceBudgetManager {
  private budgets: Map<string, ResourceBudget>;

  constructor() {
    this.budgets = new Map<string, ResourceBudget>();
  }

  addBudget(resourceName: string, initialUsage: number, limit: number): void {
    if (this.budgets.has(resourceName)) {
      console.warn(`Overwriting existing budget for ${resourceName}`);
    }
    this.budgets.set(resourceName, {
      resourceName,
      currentUsage: initialUsage,
      limit,
    });
  }

  checkBudget(resourceName: string): { available: number; isExceeded: boolean; } {
    const budget = this.budgets.get(resourceName);
    if (!budget) {
      return { available: 0, isExceeded: true };
    }
    const available = Math.max(0, budget.limit - budget.currentUsage);
    return {
      available,
      isExceeded: available < 0,
    };
  }

  consumeResource(resourceName: string, amount: number): { success: boolean; remaining: number; } {
    const budget = this.budgets.get(resourceName);
    if (!budget) {
      return { success: false, remaining: 0 };
    }

    if (budget.currentUsage + amount > budget.limit) {
      return { success: false, remaining: Math.max(0, budget.limit - budget.currentUsage) };
    }

    const newUsage = budget.currentUsage + amount;
    this.budgets.set(resourceName, {
      resourceName: budget.resourceName,
      currentUsage: newUsage,
      limit: budget.limit,
    });

    return {
      success: true,
      remaining: Math.max(0, budget.limit - newUsage),
    };
  }

  reportStatus(): Map<string, ResourceBudget> {
    return new Map(this.budgets);
  }
}