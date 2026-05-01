import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerAdvanced } from "../src/schema/structured-tool-output-schema-merger-v1024-advanced";
import {
  SchemaDefinition,
  SchemaField,
  MergeReport,
  ConflictResolutionStrategy,
} from "../src/schema/schema-types";

describe("StructuredToolOutputSchemaMergerAdvanced", () => {
  it("should merge two schemas when conflict strategy is PreferLatest", async () => {
    const merger = new StructuredToolOutputSchemaMergerAdvanced(
      ConflictResolutionStrategy.PreferLatest
    );

    const schemaA: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["name"],
    };

    const schemaB: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string", description: "The user's name" },
        email: { type: "string" },
        age: { type: "number" }, // Conflict: type change
      },
      required: ["name", "email"],
    };

    const result = await merger.mergeWithConflictResolution(
      schemaA,
      schemaB
    );

    expect(result.mergedSchema).toBeDefined();
    expect(result.mergedSchema?.properties?.name?.type).toBe("string");
    expect(result.mergedSchema?.properties?.age?.type).toBe("number"); // Should prefer B's type
    expect(result.mergedSchema?.properties?.email).toBeDefined();
    expect(result.conflictReport.conflicts).toHaveLength(1);
    expect(result.conflictReport.conflicts[0].field).toBe("age");
    expect(result.conflictReport.conflicts[0].resolution).toBe("PreferLatest");
  });

  it("should merge two schemas when conflict strategy is PreferEarliest", async () => {
    const merger = new StructuredToolOutputSchemaMergerAdvanced(
      ConflictResolutionStrategy.PreferEarliest
    );

    const schemaA: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string" },
        value: { type: "integer" },
      },
      required: ["id"],
    };

    const schemaB: SchemaDefinition = {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique ID" },
        value: { type: "string" }, // Conflict: type change
      },
      required: ["id", "value"],
    };

    const result = await merger.mergeWithConflictResolution(
      schemaA,
      schemaB
    );

    expect(result.mergedSchema).toBeDefined();
    expect(result.mergedSchema?.properties?.id?.type).toBe("string");
    expect(result.mergedSchema?.properties?.value?.type).toBe("integer"); // Should prefer A's type
    expect(result.mergedSchema?.properties?.id?.description).toBeUndefined(); // Should keep A's description if B overwrites it
    expect(result.conflictReport.conflicts).toHaveLength(1);
    expect(result.conflictReport.conflicts[0].field).toBe("value");
    expect(result.conflictReport.conflicts[0].resolution).toBe("PreferEarliest");
  });

  it("should handle merging schemas with no conflicts", async () => {
    const merger = new StructuredToolOutputSchemaMergerAdvanced(
      ConflictResolutionStrategy.PreferLatest
    );

    const schemaA: SchemaDefinition = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const schemaB: SchemaDefinition = {
      type: "object",
      properties: {
        age: { type: "integer" },
      },
      required: ["age"],
    };

    const result = await merger.mergeWithConflictResolution(
      schemaA,
      schemaB
    );

    expect(result.mergedSchema).toBeDefined();
    expect(result.mergedSchema?.properties?.name).toBeDefined();
    expect(result.mergedSchema?.properties?.age).toBeDefined();
    expect(result.conflictReport.conflicts).toHaveLength(0);
  });
});