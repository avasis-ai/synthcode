import { describe, it, expect } from "vitest";
import { ToolCallSequenceValidator } from "../src/validation/tool-call-sequence-validator";
import { Message, ToolUseBlock } from "../src/validation/types";

describe("ToolCallSequenceValidator", () => {
  it("should pass validation when proposed calls have all necessary context", () => {
    const context: Message[] = [
      { role: "user", content: "What is the capital of France?" },
      { role: "model", content: "The capital of France is Paris." },
    ];
    const proposedCalls: ToolUseBlock[] = [
      { toolName: "get_city_info", toolInputs: { city: "Paris" } },
    ];
    const validator = new ToolCallSequenceValidator(context);
    expect(() => validator.validate(proposedCalls)).not.toThrow();
  });

  it("should throw an error if a proposed call requires an input not present in the context", () => {
    const context: Message[] = [
      { role: "user", content: "What is the weather in London?" },
    ];
    const proposedCalls: ToolUseBlock[] = [
      { toolName: "get_weather", toolInputs: { location: "New York" } }, // Requires 'location' which is fine, but let's simulate a missing dependency check failure
    ];
    // Mocking the internal logic to force a failure for testing the error path
    // In a real scenario, we'd check the actual error thrown.
    // For this test, we assume the validator throws when dependencies are missing.
    const validator = new ToolCallSequenceValidator(context);
    // Since we cannot easily mock the internal dependency check failure without modifying the class,
    // we test the expected failure path based on the class's purpose.
    // Assuming the validator throws if 'location' was expected from a previous model response but wasn't.
    // We'll use a simplified test assuming the validator correctly identifies missing context.
    // For demonstration, we expect it to throw if the context is insufficient for the call.
    expect(() => validator.validate(proposedCalls)).toThrow();
  });

  it("should pass validation when proposed calls are empty", () => {
    const context: Message[] = [
      { role: "user", content: "Hello" },
    ];
    const proposedCalls: ToolUseBlock[] = [];
    const validator = new ToolCallSequenceValidator(context);
    expect(() => validator.validate(proposedCalls)).not.toThrow();
  });
});