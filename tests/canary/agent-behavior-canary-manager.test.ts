import { describe, it, expect, vi } from "vitest";
import { CanaryManager, CanaryRule } from "../src/canary/agent-behavior-canary-manager";

describe("CanaryManager", () => {
  it("should initialize correctly with an empty list of rules", () => {
    const manager = new CanaryManager([]);
    expect(manager.getRules()).toHaveLength(0);
  });

  it("should calculate the correct weight for a given set of rules", () => {
    const rules: CanaryRule[] = [
      { name: "Rule A", weight: 10, strategy: vi.fn() },
      { name: "Rule B", weight: 30, strategy: vi.fn() },
      { name: "Rule C", weight: 60, strategy: vi.fn() },
    ];
    const manager = new CanaryManager(rules);
    // Total weight should be 10 + 30 + 60 = 100
    expect(manager.getTotalWeight()).toBe(100);
  });

  it("should select a rule based on weighted probability", () => {
    const rules: CanaryRule[] = [
      { name: "LowWeight", weight: 1, strategy: vi.fn() },
      { name: "HighWeight", weight: 9, strategy: vi.fn() },
    ];
    const manager = new CanaryManager(rules);

    // Mock Math.random to ensure predictable selection
    // 1. Select LowWeight (0 to 1)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    let selectedRule = manager.selectRule();
    expect(selectedRule?.name).toBe("LowWeight");

    // 2. Select HighWeight (1 to 10)
    vi.spyOn(Math, "random").mockReturnValue(1.5);
    selectedRule = manager.selectRule();
    expect(selectedRule?.name).toBe("HighWeight");
  });
});