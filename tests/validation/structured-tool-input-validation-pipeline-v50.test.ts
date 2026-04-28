import { describe, it, expect } from "vitest";
import { Structu } from "../src/validation/structured-tool-input-validation-pipeline-v50";

describe("Structu", () => {
  it("should initialize correctly with default values", () => {
    const pipeline = new Structu();
    expect(pipeline).toBeInstanceOf(Structu);
  });

  it("should process a valid input structure", async () => {
    const pipeline = new Structu();
    const context: any = {
      input: {
        toolName: "search",
        parameters: { query: "test query" },
      },
      history: [],
      metadata: {},
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should detect and report validation errors for missing required fields", async () => {
    const pipeline = new Structu();
    const context: any = {
      input: {
        toolName: "search",
        parameters: {}, // Missing required 'query'
      },
      history: [],
      metadata: {},
    };
    const result = await pipeline.validate(context);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required parameter: query");
  });
});