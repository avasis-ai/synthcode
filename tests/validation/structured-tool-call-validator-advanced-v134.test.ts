import { describe, it, expect } from "vitest";
import { AdvancedToolCallValidator } from "../src/validation/structured-tool-call-validator-advanced-v134";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("AdvancedToolCallValidator", () => {
  it("should initialize with no rules if none are provided", () => {
    const validator = new AdvancedToolCallValidator();
    // Assuming there's a way to check internal state or a getter for rules count
    // For this test, we'll rely on the addRule functionality if we can't access private members easily.
    // A more robust test would require an accessor or mocking.
    // For now, we'll just check if instantiation doesn't throw.
    expect(validator).toBeDefined();
  });

  it("should allow adding multiple rules", () => {
    const mockRule1 = { validate: () => ({ isValid: true, message: "" }) };
    const mockRule2 = { validate: () => ({ isValid: true, message: "" }) };
    const validator = new AdvancedToolCallValidator();
    validator.addRule(mockRule1);
    validator.addRule(mockRule2);
    // Again, assuming internal state check is difficult, we'll test the addRule return type/behavior.
    // If addRule returns 'this', we check that.
    expect(validator.addRule(mockRule1)).toBe(validator);
  });

  it("should validate tool calls against all added rules and return the first failure", () => {
    const history: Message[] = [{ role: "user", content: "Test" }];
    const toolCalls: ToolUseBlock[] = [{ toolName: "test-tool", arguments: {} }];

    const failingRule: any = {
      validate: (history: Message[], toolCalls: ToolUseBlock[]): { isValid: boolean; message: string; details?: Record<string, any> } => {
        return { isValid: false, message: "Validation failed on specific rule" };
      },
    };
    const passingRule: any = {
      validate: (history: Message[], toolCalls: ToolUseBlock[]): { isValid: boolean; message: string; details?: Record<string, any> } => {
        return { isValid: true, message: "OK" };
      },
    };

    const validator = new AdvancedToolCallValidator([passingRule, failingRule]);
    const result = validator.validate(history, toolCalls);

    expect(result.isValid).toBe(false);
    expect(result.message).toContain("Validation failed on specific rule");
  });
});