import { describe, it, expect } from "vitest";
import { mergeSchemas } from "../src/schema/structured-tool-output-schema-merger-v18";

describe("mergeSchemas", () => {
  it("should correctly merge two simple string schemas", () => {
    const schema1 = { type: "string", description: "First string" };
    const schema2 = { type: "string", description: "Second string" };
    const merged = mergeSchemas(schema1, schema2);
    expect(merged).toEqual({ type: "string", description: "Second string" });
  });

  it("should correctly merge two object schemas with overlapping properties", () => {
    const schema1 = {
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string" },
      },
    };
    const schema2 = {
      type: "object",
      properties: {
        name: { type: "string", description: "Updated name" },
        email: { type: "string" },
      },
    };
    const merged = mergeSchemas(schema1, schema2);
    expect(merged).toEqual({
      type: "object",
      properties: {
        id: { type: "number" },
        name: { type: "string", description: "Updated name" },
        email: { type: "string" },
      },
    });
  });

  it("should handle merging schemas with different types for the same property (preferring the second schema's type)", () => {
    const schema1 = {
      type: "object",
      properties: {
        value: { type: "string" },
      },
    };
    const schema2 = {
      type: "object",
      properties: {
        value: { type: "number" },
      },
    };
    const merged = mergeSchemas(schema1, schema2);
    expect(merged.properties.value.type).toBe("number");
  });
});