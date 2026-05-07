import { describe, it, expect } from "vitest";
import { ContextualBudgetEnforcer } from "../src/context/contextual-budget-enforcer";

describe("ContextualBudgetEnforcer", () => {
  it("should calculate usage correctly for a simple context", () => {
    const mockBudget: ContextualBudget = {
      maxTokens: 100,
      maxCost: 10,
      calculateUsage: (context) => ({ tokens: context.length * 10, cost: context.length * 1 }),
    };
    const enforcer = new ContextualBudgetEnforcer(mockBudget);
    const context = [
      { type: "user", content: "Hello", tokens: 10, cost: 0.1 },
      { type: "assistant", content: "Hi there", tokens: 20, cost: 0.2 },
    ];
    const usage = enforcer.calculateUsage(context);
    expect(usage.tokens).toBe(20);
    expect(usage.cost).toBe(0.3);
  });

  it("should correctly identify when the token budget is exceeded", () => {
    const mockBudget: ContextualBudget = {
      maxTokens: 50,
      maxCost: 10,
      calculateUsage: (context) => ({ tokens: context.length * 10, cost: context.length * 1 }),
    };
    const enforcer = new ContextualBudgetEnforcer(mockBudget);
    const context = [
      { type: "user", content: "A long message", tokens: 30, cost: 0.5 },
      { type: "assistant", content: "Another long message", tokens: 30, cost: 0.5 },
    ];
    const usage = enforcer.calculateUsage(context);
    expect(usage.tokens).toBe(60);
    expect(usage.isExceeded).toBe(true);
  });

  it("should correctly identify when the cost budget is exceeded", () => {
    const mockBudget: ContextualBudget = {
      maxTokens: 100,
      maxCost: 1,
      calculateUsage: (context) => ({ tokens: context.length * 10, cost: context.length * 1 }),
    };
    const enforcer = new ContextualBudgetEnforcer(mockBudget);
    const context = [
      { type: "user", content: "Message 1", tokens: 10, cost: 0.5 },
      { type: "assistant", content: "Message 2", tokens: 10, cost: 0.6 },
    ];
    const usage = enforcer.calculateUsage(context);
    expect(usage.tokens).toBe(20);
    expect(usage.cost).toBe(1.1);
    expect(usage.isExceeded).toBe(true);
  });
});