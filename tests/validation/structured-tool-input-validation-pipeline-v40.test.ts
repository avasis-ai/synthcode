import { describe, it, expect } from "vitest";
import { validateStructuredToolInputPipelineV40 } from "../src/validation/structured-tool-input-validation-pipeline-v40";

describe("validateStructuredToolInputPipelineV40", () => {
  it("should return valid when input matches the expected structure", async () => {
    const mockInput = {
      messages: [
        { type: "user", content: { text: "Hello" } }
      ]
    };
    const result = await validateStructuredToolInputPipelineV40(mockInput, {});
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should return invalid with errors when messages array is missing", async () => {
    const mockInput = {
      messages: undefined as any
    };
    const result = await validateStructuredToolInputPipelineV40(mockInput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("messages array is required");
  });

  it("should return invalid with errors when a message is malformed", async () => {
    const mockInput = {
      messages: [
        { type: "user", content: {} } // Missing text
      ]
    };
    const result = await validateStructuredToolInputPipelineV40(mockInput, {});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Message content must contain text");
  });
});