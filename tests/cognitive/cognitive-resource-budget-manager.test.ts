import { describe, it, expect, vi } from "vitest";
import { CognitiveResourceBudgetManager } from "../src/cognitive/cognitive-resource-budget-manager";

describe("CognitiveResourceBudgetManager", () => {
  it("should initialize correctly and track initial budget", () => {
    const budgetManager = new CognitiveResourceBudgetManager(100);
    expect(budgetManager.getBudget()).toBe(100);
    expect(budgetManager.getRemainingBudget()).toBe(100);
  });

  it("should deduct budget when processing a message", async () => {
    const budgetManager = new CognitiveResourceBudgetManager(50);
    const message = { role: "user", content: "Hello" };
    await budgetManager.processMessage(message);
    expect(budgetManager.getRemainingBudget()).toBeLessThan(50);
  });

  it("should handle budget exhaustion and prevent further processing", async () => {
    const budgetManager = new CognitiveResourceBudgetManager(10);
    const message = { role: "user", content: "Test" };
    await budgetManager.processMessage(message);
    expect(budgetManager.getRemainingBudget()).toBeLessThan(10);
    // Simulate processing another message when budget is low
    const result = await budgetManager.processMessage({ role: "user", content: "Another test" });
    expect(result).toBe(false);
  });
});