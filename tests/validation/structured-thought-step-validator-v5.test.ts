import { describe, it, expect } from "vitest";
import { StructuredThoughtStepValidatorV5 } from "../src/validation/structured-thought-step-validator-v5";

describe("StructuredThoughtStepValidatorV5", () => {
  it("should validate a simple valid structure", async () => {
    const validator = new StructuredThoughtStepValidatorV5();
    const validContent = [
      { type: "text", text: "Initial thought." },
      { type: "thinking", content: "Step 1: Analyze input." },
      { type: "text", text: "Next step." },
    ];
    await expect(validator.validate(validContent)).resolves.toBe(true);
  });

  it("should fail validation if a required 'thinking' block is missing", async () => {
    const validator = new StructuredThoughtStepValidatorV5();
    const invalidContent = [
      { type: "text", text: "Start." },
      { type: "text", text: "End." },
    ];
    await expect(validator.validate(invalidContent)).rejects.toThrow(/Missing required thinking step/);
  });

  it("should handle complex structure with tool use blocks correctly", async () => {
    const validator = new StructuredThoughtStepValidatorV5();
    const validContentWithTool = [
      { type: "text", text: "Thinking about tool use." },
      { type: "thinking", content: "Step 1: Determine tool call." },
      { type: "tool_use", id: "tool_123", name: "search", content: "query" },
      { type: "text", text: "Finished." },
    ];
    await expect(validator.validate(validContentWithTool)).resolves.toBe(true);
  });
});