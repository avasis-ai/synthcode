import { describe, it, expect } from "vitest";
import { AttentionBudget } from "../src/budgeting/attention-budgeting-manager";

describe("AttentionBudgetingManager", () => {
  it("should initialize with default values if none are provided", () => {
    const budget = new AttentionBudget({});
    expect(budget.max_depth).toBe(1);
    expect(budget.max_complexity_score).toBe(1);
    expect(budget.max_turns).toBe(3);
    expect(budget.initial_focus_score).toBe(0);
  });

  it("should correctly set values when provided a valid AttentionBudget object", () => {
    const budget = new AttentionBudget({
      max_depth: 5,
      max_complexity_score: 10,
      max_turns: 5,
      initial_focus_score: 0.5,
    });
    expect(budget.max_depth).toBe(5);
    expect(budget.max_complexity_score).toBe(10);
    expect(budget.max_turns).toBe(5);
    expect(budget.initial_focus_score).toBe(0.5);
  });

  it("should handle edge cases like zero or negative inputs gracefully (assuming validation is handled elsewhere)", () => {
    // Note: If the class implementation handles validation, this test should reflect that.
    // Assuming the constructor accepts numbers and sets them directly for this test.
    const budget = new AttentionBudget({
      max_depth: 0,
      max_complexity_score: 0,
      max_turns: 0,
      initial_focus_score: -1,
    });
    expect(budget.max_depth).toBe(0);
    expect(budget.max_complexity_score).toBe(0);
    expect(budget.max_turns).toBe(0);
    expect(budget.initial_focus_score).toBe(-1);
  });
});