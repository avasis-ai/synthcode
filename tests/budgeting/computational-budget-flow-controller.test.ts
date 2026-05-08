import { describe, it, expect, vi } from "vitest";
import {
  BudgetConfig,
  BudgetExceededReport,
  PlanStep,
  PlanContext,
} from "../src/budgeting/computational-budget-flow-controller";

describe("computationalBudgetFlowController", () => {
  it("should successfully process a plan within budget", async () => {
    const mockContext: PlanContext = {
      currentPlan: {
        description: "Initial step",
        estimatedCost: 10,
        action: "tool_call",
      },
    };
    const mockConfig: BudgetConfig = {
      maxTotalCost: 100,
      stepBudgets: {
        "Initial step": 50,
      },
    };

    const result = await mockContext.processPlan(mockConfig);

    expect(result).toEqual({
      isWithinBudget: true,
      remainingBudget: 90,
      report: null,
    });
  });

  it("should report budget overrun when total cost exceeds maxTotalCost", async () => {
    const mockContext: PlanContext = {
      currentPlan: {
        description: "Expensive step",
        estimatedCost: 70,
        action: "text_generation",
      },
    };
    const mockConfig: BudgetConfig = {
      maxTotalCost: 100,
      stepBudgets: {
        "Expensive step": 20,
      },
    };

    const result = await mockContext.processPlan(mockConfig);

    expect(result.isWithinBudget).toBe(false);
    expect(result.report).toBeInstanceOf(BudgetExceededReport);
    expect((result.report as BudgetExceededReport).exceededBudget).toBe(
      70 - 80,
    );
  });

  it("should handle steps that are skipped and maintain budget integrity", async () => {
    const mockContext: PlanContext = {
      currentPlan: {
        description: "Skipped step",
        estimatedCost: 0,
        action: "skip",
      },
    };
    const mockConfig: BudgetConfig = {
      maxTotalCost: 50,
      stepBudgets: {
        "Skipped step": 10,
      },
    };

    const result = await mockContext.processPlan(mockConfig);

    expect(result.isWithinBudget).toBe(true);
    expect(result.remainingBudget).toBe(50);
    expect(result.report).toBeNull();
  });
});