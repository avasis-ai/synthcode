import { describe, it, expect } from "vitest";
import { StructuredToolCallValidationChainBuilderV131 } from "../src/validation/structured-tool-call-validation-chain-builder-v131";

describe("StructuredToolCallValidationChainBuilderV131", () => {
  it("should correctly build and validate a simple valid tool call structure", async () => {
    const builder = new StructuredToolCallValidationChainBuilderV131();
    const result = await builder.buildAndValidate({
      history: [{ role: "user", content: "What is the weather?" }],
      toolCall: {
        toolName: "get_weather",
        toolInputs: { location: "San Francisco" },
      },
    });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should fail validation if the toolName is missing", async () => {
    const builder = new StructuredToolCallValidationChainBuilderV131();
    const result = await builder.buildAndValidate({
      history: [{ role: "user", content: "What is the weather?" }],
      toolCall: {
        toolName: undefined as any,
        toolInputs: { location: "San Francisco" },
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("toolName is required");
  });

  it("should fail validation if toolInputs is missing", async () => {
    const builder = new StructuredToolCallValidationChainBuilderV131();
    const result = await builder.buildAndValidate({
      history: [{ role: "user", content: "What is the weather?" }],
      toolCall: {
        toolName: "get_weather",
        toolInputs: undefined as any,
      },
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("toolInputs is required");
  });
});