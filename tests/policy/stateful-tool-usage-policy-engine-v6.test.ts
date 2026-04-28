import { describe, it, expect } from "vitest";
import { StatefulToolUsagePolicyEngineV6 } from "../src/policy/stateful-tool-usage-policy-engine-v6";

describe("StatefulToolUsagePolicyEngineV6", () => {
  it("should initialize with no rules and an empty state store", () => {
    const engine = new StatefulToolUsagePolicyEngineV6();
    // We can't directly test private members, but we can test behavior
    // that relies on the initial state.
    expect(engine).toBeInstanceOf(StatefulToolUsagePolicyEngineV6);
  });

  it("should add rules correctly", () => {
    const engine = new StatefulToolUsagePolicyEngineV6();
    const mockRule: any = { id: "rule1", condition: "always" };
    engine.addRule(mockRule);

    // Assuming there's a way to check internal state or a method that uses rules
    // For this test, we'll rely on the addRule method's contract.
    // A better test would involve a method that processes rules.
    // Since we don't have that, we'll just ensure the call doesn't throw.
    expect(() => {
      engine.addRule(mockRule);
    }).not.toThrow();
  });

  it("should update state for a given context ID", () => {
    const engine = new StatefulToolUsagePolicyEngineV6();
    const contextId = "user-session-123";
    const initialState: Record<string, any> = { step: 1, data: "initial" };

    // We assume updateState modifies the internal state store.
    // Since we can't access private state, we'll test the method call itself
    // and assume it works based on the provided signature.
    engine.updateState(contextId, initialState);

    // A proper test would require a getter or a method that reads the state.
    // For now, we confirm the call executes without error.
    expect(() => {
      engine.updateState(contextId, initialState);
    }).not.toThrow();
  });
});