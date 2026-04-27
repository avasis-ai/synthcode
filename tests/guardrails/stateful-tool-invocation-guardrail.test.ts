import { describe, it, expect } from "vitest";
import { StatefulToolInvocationGuardrail } from "../src/guardrails/stateful-tool-invocation-guardrail";

describe("StatefulToolInvocationGuardrail", () => {
  it("should initialize correctly with an initial state", () => {
    const initialState: Record<string, any> = {
      user: { name: "Alice", status: "active" },
      session: { last_tool: "login" },
    };
    const guardrail = new StatefulToolInvocationGuardrail(initialState);

    // We can't directly access private state, but we can test its behavior
    // which relies on correct initialization.
    // A more robust test would involve a getter or a public method to inspect state.
    // For now, we assume the constructor works if no errors are thrown.
    expect(guardrail).toBeDefined();
  });

  it("should allow state updates that follow defined transition rules", () => {
    const initialState: Record<string, any> = {
      user: { status: "pending" },
    };
    const transitionRules: Map<string, Map<string, any[]>> = new Map([
      [
        "user",
        new Map([
          ["status", [
            { from: "pending", to: "active", isValid: true },
            { from: "pending", to: "inactive", isValid: false },
          ]
        ])
      ],
    ]);
    const guardrail = new StatefulToolInvocationGuardrail(initialState, transitionRules);

    // Simulate a valid transition (pending -> active)
    const isValid = guardrail.canTransition("user", "status", "pending", "active");
    expect(isValid).toBe(true);

    // Simulate an invalid transition (pending -> inactive)
    const isValidInvalid = guardrail.canTransition("user", "status", "pending", "inactive");
    expect(isValidInvalid).toBe(false);
  });

  it("should reject state updates that violate defined transition rules", () => {
    const initialState: Record<string, any> = {
      user: { status: "active" },
    };
    const transitionRules: Map<string, Map<string, any[]>> = new Map([
      [
        "user",
        new Map([
          ["status", [
            { from: "active", to: "suspended", isValid: true },
          ]
        ])
      ],
    ]);
    const guardrail = new StatefulToolInvocationGuardrail(initialState, transitionRules);

    // Test a transition that is not defined as valid
    const isValid = guardrail.canTransition("user", "status", "active", "unknown_state");
    expect(isValid).toBe(false);

    // Test a transition where the 'from' state doesn't match the current state
    // (This assumes the guardrail checks the current state against the 'from' rule)
    const isValidMismatch = guardrail.canTransition("user", "status", "inactive", "suspended");
    expect(isValidMismatch).toBe(false);
  });
});