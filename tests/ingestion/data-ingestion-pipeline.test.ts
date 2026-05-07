import { describe, it, expect, vi } from "vitest";
import { DataIngestionPipeline } from "../src/ingestion/data-ingestion-pipeline";

describe("DataIngestionPipeline", () => {
  it("should initialize correctly with required context", async () => {
    const mockContext: any = {
      rawInput: { id: 1, name: "Test" },
      targetSchema: { id: { type: "number", required: true }, name: { type: "string", required: false } },
      intermediateData: {},
      errors: [],
    };
    const pipeline = new DataIngestionPipeline(mockContext);
    expect(pipeline).toBeInstanceOf(DataIngestionPipeline);
    expect(pipeline.context).toBe(mockContext);
  });

  it("should process data successfully when all steps pass", async () => {
    const mockContext: any = {
      rawInput: { id: 1, name: "Test" },
      targetSchema: { id: { type: "number", required: true }, name: { type: "string", required: false } },
      intermediateData: {},
      errors: [],
    };

    // Mocking the internal steps for a successful run
    const mockPipeline = new DataIngestionPipeline(mockContext);
    mockPipeline.setSteps([
      async () => ({ success: true, data: { id: 1, name: "Test" }, errors: [] }),
      async () => ({ success: true, data: { processed: true }, errors: [] }),
    ]);

    const result = await mockPipeline.run();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 1, name: "Test", processed: true });
    expect(result.errors).toEqual([]);
  });

  it("should handle failures and accumulate errors across steps", async () => {
    const mockContext: any = {
      rawInput: { id: "invalid", name: "Test" },
      targetSchema: { id: { type: "number", required: true }, name: { type: "string", required: false } },
      intermediateData: {},
      errors: [],
    };

    // Mocking steps where the first fails and the second also fails
    const mockPipeline = new DataIngestionPipeline(mockContext);
    mockPipeline.setSteps([
      async () => ({ success: false, data: {}, errors: ["Step 1 failed: ID is not a number"] }),
      async () => ({ success: false, data: {}, errors: ["Step 2 failed: Missing required field"] }),
    ]);

    const result = await mockPipeline.run();

    expect(result.success).toBe(false);
    expect(result.data).toEqual({});
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain("Step 1 failed: ID is not a number");
    expect(result.errors).toContain("Step 2 failed: Missing required field");
  });
});