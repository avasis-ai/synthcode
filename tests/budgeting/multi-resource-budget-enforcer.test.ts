import { describe, it, expect } from "vitest";
import { BudgetExceededError, BudgetConstraint, BudgetState } from "../src/budgeting/multi-resource-budget-enforcer";

describe("MultiResourceBudgetEnforcer", () => {
  it("should throw BudgetExceededError when any resource constraint is violated", () => {
    const constraints: BudgetConstraint[] = [
      { resourceType: "tokens", limit: 10 },
      { resourceType: "time", limit: 50 },
    ];
    const state: BudgetState = { tokens: 15, time: 40 };
    
    expect(() => {
      new (class {
        constructor(public constraints: BudgetConstraint[], public state: BudgetState) {}
      })(constraints, state).enforce();
    }).toThrow(BudgetExceededError);
    
    const error = (function() {
      const constraints: BudgetConstraint[] = [
        { resourceType: "tokens", limit: 10 },
        { resourceType: "time", limit: 50 },
      ];
      const state: BudgetState = { tokens: 15, time: 40 };
      return new (class {
        constructor(public constraints: BudgetConstraint[], public state: BudgetState) {}
      })(constraints, state).enforce();
    })();

    expect(error).toBeInstanceOf(BudgetExceededError);
    expect(error.violatedConstraints).toHaveLength(1);
    expect(error.violatedConstraints![0].resourceType).toBe("tokens");
    expect(error.violatedConstraints![0].current).toBe(15);
    expect(error.violatedConstraints![0].limit).toBe(10);
  });

  it("should not throw an error when all resource constraints are within limits", () => {
    const constraints: BudgetConstraint[] = [
      { resourceType: "tokens", limit: 100 },
      { resourceType: "cost", limit: 500 },
    ];
    const state: BudgetState = { tokens: 50, cost: 450 };

    expect(() => {
      new (class {
        constructor(public constraints: BudgetConstraint[], public state: BudgetState) {}
      })(constraints, state).enforce();
    }).not.toThrow();
  });

  it("should handle multiple violated constraints and report all of them", () => {
    const constraints: BudgetConstraint[] = [
      { resourceType: "tokens", limit: 5 },
      { resourceType: "time", limit: 10 },
      { resourceType: "complexity", limit: 20 },
    ];
    const state: BudgetState = { tokens: 6, time: 12, complexity: 25 };

    expect(() => {
      new (class {
        constructor(public constraints: BudgetConstraint[], public state: BudgetState) {}
      })(constraints, state).enforce();
    }).toThrow(BudgetExceededError);

    const error = (function() {
      const constraints: BudgetConstraint[] = [
        { resourceType: "tokens", limit: 5 },
        { resourceType: "time", limit: 10 },
        { resourceType: "complexity", limit: 20 },
      ];
      const state: BudgetState = { tokens: 6, time: 12, complexity: 25 };
      return new (class {
        constructor(public constraints: BudgetConstraint[], public state: BudgetState) {}
      })(constraints, state).enforce();
    })();

    expect(error).toBeInstanceOf(BudgetExceededError);
    expect(error.violatedConstraints).toHaveLength(3);
    expect(error.violatedConstraints).toEqual(
      expect.arrayContaining([
        { resourceType: "tokens", current: 6, limit: 5 },
        { resourceType: "time", current: 12, limit: 10 },
        { resourceType: "complexity", current: 25, limit: 20 },
      ])
    );
  });
});