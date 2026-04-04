import { describe, it, expect } from "vitest";
import { ToolOutputSchemaUnion } from "../src/schema/tool-output-schema-union";

describe("ToolOutputSchemaUnion", () => {
  it("should correctly merge two simple object schemas", () => {
    const schema1: any = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
    };

    const mergedSchema = (schema1 as any).mergeSchemas([schema1, schema2]);

    expect(mergedSchema.properties).toHaveProperty("id");
    expect(mergedSchema.properties).toHaveProperty("name");
    expect(mergedSchema.required).toEqual(["id", "name"]);
  });

  it("should handle merging schemas with overlapping properties by preferring the last one", () => {
    const schema1: any = {
      type: "object",
      properties: {
        common: { type: "string", description: "First description" },
      },
      required: ["common"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        common: { type: "number", description: "Second description" },
      },
      required: ["common"],
    };

    const mergedSchema = (schema1 as any).mergeSchemas([schema1, schema2]);

    // In a real implementation, the merge logic would need to be tested thoroughly.
    // Assuming the merge favors the structure of the second schema for conflicts.
    expect(mergedSchema.properties.common).toEqual({
      type: "number",
      description: "Second description",
    });
  });

  it("should maintain the object type and combine properties from multiple schemas", () => {
    const schema1: any = {
      type: "object",
      properties: {
        fieldA: { type: "boolean" },
      },
      required: ["fieldA"],
    };
    const schema2: any = {
      type: "object",
      properties: {
        fieldB: { type: "string" },
      },
      required: ["fieldB"],
    };
    const schema3: any = {
      type: "object",
      properties: {
        fieldC: { type: "null" },
      },
      required: ["fieldC"],
    };

    const mergedSchema = (schema1 as any).mergeSchemas([schema1, schema2, schema3]);

    expect(mergedSchema.properties).toHaveProperty("fieldA");
    expect(mergedSchema.properties).toHaveProperty("fieldB");
    expect(mergedSchema.properties).toHaveProperty("fieldC");
    expect(mergedSchema.required).toEqual(["fieldA", "fieldB", "fieldC"]);
  });
});