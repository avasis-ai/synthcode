import { describe, it, expect } from "vitest";
import { ContextualOutputValidator } from "../src/validation/structured-tool-output-validation-context";
import { AgentContext } from "../src/validation/agent-context";

describe("ContextualOutputValidator", () => {
  it("should return valid when all rules pass", () => {
    const validator = new ContextualOutputValidator<any>();
    const mockContext: AgentContext = {
      history: [],
      user: "testUser",
    };
    const mockOutput: any = { id: 1, name: "Test" };

    const passingRule: any = {
      validate: (context: AgentContext, output: any) => ({ isValid: true, message: "OK" }),
    };

    validator.addRule(passingRule);
    const result = validator.validate(mockContext, mockOutput);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("OK");
  });

  it("should return invalid with the first failing rule's message", () => {
    const validator = new ContextualOutputValidator<any>();
    const mockContext: AgentContext = {
      history: [],
      user: "testUser",
    };
    const mockOutput: any = { id: 1, name: "Test" };

    const failingRule: any = {
      validate: (context: AgentContext, output: any) => ({ isValid: false, message: "Validation failed for ID" }),
    };

    const passingRule: any = {
      validate: (context: AgentContext, output: any) => ({ isValid: true, message: "Should not be reached" }),
    };

    validator.addRule(failingRule);
    validator.addRule(passingRule);
    const result = validator.validate(mockContext, mockOutput);

    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Validation failed for ID");
  });

  it("should return valid if no rules are added", () => {
    const validator = new ContextualOutputValidator<any>();
    const mockContext: AgentContext = {
      history: [],
      user: "testUser",
    };
    const mockOutput: any = {};

    const result = validator.validate(mockContext, mockOutput);

    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });
});