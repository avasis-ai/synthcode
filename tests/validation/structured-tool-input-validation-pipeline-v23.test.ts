import { describe, it, expect } from "vitest";
import { ValidationStep } from "../src/validation/structured-tool-input-validation-pipeline-v23";

describe("ValidationStep", () => {
  it("should correctly validate input data when valid", async () => {
    const mockContext: ValidationContext = {
      inputData: { toolName: "search", query: "vitest" },
      messages: [],
      state: {},
    };
    const step = new ValidationStep();
    const result = await step.execute(mockContext);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should report errors when input data is missing required fields", async () => {
    const mockContext: ValidationContext = {
      inputData: { toolName: "search" }, // Missing query
      messages: [],
      state: {},
    };
    const step = new ValidationStep();
    const result = await step.execute(mockContext);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: query");
  });

  it("should update context state upon successful validation", async () => {
    const mockContext: ValidationContext = {
      inputData: { toolName: "search", query: "test" },
      messages: [],
      state: { initial: true },
    };
    const step = new ValidationStep();
    const result = await step.execute(mockContext);
    expect(result.contextUpdates).toEqual({ validatedQuery: "test" });
  });
});