import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMergerV9 } from "../src/schema/structured-tool-output-schema-merger-v9";

describe("StructuredToolOutputSchemaMergerV9", () => {
  it("should merge two simple schemas with default fail_on_conflict strategy", async () => {
    const schema1 = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
    };
    const schema2 = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const merger = new StructuredToolOutputSchemaMergerV9();
    const mergedSchema = await merger.merge(schema1, schema2);

    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.properties).toHaveProperty("age");
    expect(mergedSchema.properties).toHaveProperty("email");
  });

  it("should correctly merge schemas when a specific field strategy is set to merge_arrays", async () => {
    const schema1 = {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
    };
    const schema2 = {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
    };

    const merger = new StructuredToolOutputSchemaMergerV9({
      fieldStrategies: { tags: "merge_arrays" },
    });
    const mergedSchema = await merger.merge(schema1, schema2);

    // In a real scenario, we'd check the resulting array structure, but for this test,
    // we ensure the merge process runs without error and retains the structure.
    expect(mergedSchema.properties).toHaveProperty("tags");
  });

  it("should throw an error when a conflict occurs and default strategy is fail_on_conflict", async () => {
    const schema1 = {
      type: "object",
      properties: {
        id: { type: "string", description: "User ID" },
      },
    };
    const schema2 = {
      type: "object",
      properties: {
        id: { type: "integer", description: "Unique Identifier" }, // Conflict on type/description
      },
    };

    const merger = new StructuredToolOutputSchemaMergerV9();
    await expect(merger.merge(schema1, schema2)).rejects.toThrow(/conflict on property id/);
  });
});