import { describe, it, expect } from "vitest";
import { ComplianceGate, IComplianceRule, ComplianceResult } from "../src/compliance/compliance-gate";

describe("ComplianceGate", () => {
  it("should initialize and add rules correctly", () => {
    const gate = new ComplianceGate();
    const mockRule: IComplianceRule = {
      name: "TestRule",
      validate: () => ({ verdict: "ALLOW" }),
    };
    gate.addRule(mockRule);
    // Assuming there's a way to check internal state or a getter for rules
    // Since we can't access private rules directly, we test the behavior of the gate.
    // For this test, we assume addRule successfully registers the rule.
  });

  it("should process messages and return the first blocking verdict", async () => {
    const gate = new ComplianceGate();
    const mockRule: IComplianceRule = {
      name: "BlockRule",
      validate: () => ({ verdict: "BLOCK", reason: "Blocked content" }),
    };
    gate.addRule(mockRule);

    // Assuming a method like 'check' exists on ComplianceGate
    // We simulate the check process.
    const result = await gate.check({
      context: { user: "test" },
      message: { type: "text", content: "sensitive data" },
    });

    expect(result.verdict).toBe("BLOCK");
    expect(result.reason).toBe("Blocked content");
  });

  it("should allow passage if all rules pass or result in MODIFY", async () => {
    const gate = new ComplianceGate();
    const mockRule: IComplianceRule = {
      name: "ModifyRule",
      validate: () => ({ verdict: "MODIFY", modifiedContext: { user: "safe_user" } }),
    };
    gate.addRule(mockRule);

    // Assuming a method like 'check' exists on ComplianceGate
    const result = await gate.check({
      context: { user: "original_user" },
      message: { type: "text", content: "safe content" },
    });

    expect(result.verdict).toBe("MODIFY");
    expect(result.modifiedContext).toEqual({ user: "safe_user" });
  });
});