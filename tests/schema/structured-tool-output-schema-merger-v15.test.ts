import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV15, ConflictResolutionStrategy } from "../src/schema/structured-tool-output-schema-merger-v15";

describe("StructuredToolOutputSchemaMergerV15", () => {
  it("should merge schemas correctly with PreferLatest strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV15(ConflictResolutionStrategy.PreferLatest);
    const schema1: any = {
      name: "tool_output",
      properties: {
        id: { type: "string" },
        result: { type: "string" },
      },
    };
    const schema2: any = {
      name: "tool_output",
      properties: {
        id: { type: "string", description: "New description" },
        timestamp: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.id).toEqual({ type: "string", description: "New description" });
    expect(mergedSchema.properties.result).toBeUndefined();
    expect(mergedSchema.properties.timestamp).toEqual({ type: "string" });
  });

  it("should merge schemas correctly with UnionAll strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV15(ConflictResolutionStrategy.UnionAll);
    const schema1: any = {
      name: "tool_output",
      properties: {
        id: { type: "string" },
        result: { type: "string" },
      },
    };
    const schema2: any = {
      name: "tool_output",
      properties: {
        id: { type: "string", description: "New description" },
        timestamp: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.id).toEqual({ type: "string", description: "New description" });
    expect(mergedSchema.properties.result).toEqual({ type: "string" });
    expect(mergedSchema.properties.timestamp).toEqual({ type: "string" });
  });

  it("should merge schemas correctly with MergeByType strategy", () => {
    const merger = new StructuredToolOutputSchemaMergerV15(ConflictResolutionStrategy.MergeByType);
    const schema1: any = {
      name: "tool_output",
      properties: {
        id: { type: "string", description: "Original description" },
        value: { type: "number" },
      },
    };
    const schema2: any = {
      name: "tool_output",
      properties: {
        id: { type: "string", description: "New description" },
        value: { type: "string" },
      },
    };

    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.properties.id).toEqual({ type: "string", description: "New description" });
    // In MergeByType, if types conflict, it might keep one or merge based on implementation details.
    // Assuming for this test that it prefers the latest type if they are different, or merges if possible.
    // Based on typical schema merging, we expect the most descriptive/complete result.
    expect(mergedSchema.properties.value).toEqual({ type: "string" });
  });
});