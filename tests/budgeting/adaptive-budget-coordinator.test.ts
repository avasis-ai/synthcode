import { describe, it, expect } from "vitest";
import { AdaptiveBudgetCoordinator, BudgetProfile } from "../src/budgeting/adaptive-budget-coordinator";

describe("AdaptiveBudgetCoordinator", () => {
  it("should initialize with a valid budget profile", () => {
    const profile: BudgetProfile = { tokens: 1000, time: 5, cycles: 3 };
    const coordinator = new AdaptiveBudgetCoordinator(profile);
    expect(coordinator).toBeDefined();
    expect(coordinator.getBudget()).toEqual(profile);
  });

  it("should correctly calculate and apply budget reductions when resources are consumed", () => {
    const initialProfile: BudgetProfile = { tokens: 100, time: 10, cycles: 5 };
    const coordinator = new AdaptiveBudgetCoordinator(initialProfile);

    // Simulate resource consumption
    coordinator.consumeResource("tokens", 20);
    coordinator.consumeResource("time", 5);

    // Check if the budget has been reduced
    expect(coordinator.getBudget().tokens).toBe(80);
    expect(coordinator.getBudget().time).toBe(5);
    expect(coordinator.getBudget().cycles).toBe(5);
  });

  it("should handle over-consumption gracefully and report remaining budget", () => {
    const initialProfile: BudgetProfile = { tokens: 50, time: 1, cycles: 1 };
    const coordinator = new AdaptiveBudgetCoordinator(initialProfile);

    // Attempt to consume more tokens than available
    coordinator.consumeResource("tokens", 60);

    // Tokens should be capped at 0, and the budget should reflect the remaining resources
    expect(coordinator.getBudget().tokens).toBe(0);
    expect(coordinator.getBudget().time).toBe(1);
    expect(coordinator.getBudget().cycles).toBe(1);
  });
});