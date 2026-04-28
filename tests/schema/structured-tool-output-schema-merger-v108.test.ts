import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaMerger } from "../src/schema/structured-tool-output-schema-merger-v108";

describe("StructuredToolOutputSchemaMerger", () => {
  it("should merge two schemas correctly using 'latest' strategy", () => {
    const schema1: any = {
      name: "toolA",
      description: "Description A",
      parameters: {
        type: "object",
        properties: {
          field1: { type: "string" },
          field2: { type: "number" },
        },
        required: ["field1"],
      },
    };
    const schema2: any = {
      name: "toolB",
      description: "Description B",
      parameters: {
        type: "object",
        properties: {
          field2: { type: "boolean" },
          field3: { type: "string" },
        },
        required: ["field2", "field3"],
      },
    };

    const merger = new StructuredToolOutputSchemaMerger("latest");
    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.name).toBe("toolB"); // Latest overwrites
    expect(mergedSchema.description).toBe("Description B"); // Latest overwrites
    expect(mergedSchema.parameters.properties.field1).toEqual({ type: "string" }); // Kept from schema1
    expect(mergedSchema.parameters.properties.field2).toEqual({ type: "boolean" }); // Overwritten by schema2
    expect(mergedSchema.parameters.properties.field3).toEqual({ type: "string" }); // Added from schema2
    expect(mergedSchema.parameters.required).toEqual(["field2", "field3"]); // Updated required fields
  });

  it("should merge two schemas correctly using 'most_specific' strategy", () => {
    const schema1: any = {
      name: "toolA",
      description: "Description A",
      parameters: {
        type: "object",
        properties: {
          field1: { type: "string" },
          field2: { type: "number" },
        },
        required: ["field1"],
      },
    };
    const schema2: any = {
      name: "toolB",
      description: "Description B",
      parameters: {
        type: "object",
        properties: {
          field2: { type: "boolean" }, // More specific type
          field3: { type: "string" },
        },
        required: ["field2", "field3"],
      },
    };

    const merger = new StructuredToolOutputSchemaMerger("most_specific");
    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.name).toBe("toolA"); // Keeps first name if not explicitly overridden
    expect(mergedSchema.description).toBe("Description A"); // Keeps first description
    expect(mergedSchema.parameters.properties.field1).toEqual({ type: "string" });
    expect(mergedSchema.parameters.properties.field2).toEqual({ type: "boolean" }); // Most specific type wins
    expect(mergedSchema.parameters.properties.field3).toEqual({ type: "string" });
    expect(mergedSchema.parameters.required).toEqual(["field1", "field2", "field3"]); // Union of required fields
  });

  it("should handle merging with missing properties gracefully", () => {
    const schema1: any = {
      name: "toolA",
      description: "Description A",
      parameters: {
        type: "object",
        properties: {
          field1: { type: "string" },
        },
        required: ["field1"],
      },
    };
    const schema2: any = {
      name: "toolB",
      description: "Description B",
      parameters: {
        type: "object",
        properties: {
          field2: { type: "number" },
        },
        required: [],
      },
    };

    const merger = new StructuredToolOutputSchemaMerger("latest");
    const mergedSchema = merger.merge(schema1, schema2);

    expect(mergedSchema.name).toBe("toolB");
    expect(mergedSchema.parameters.properties.field1).toBeDefined();
    expect(mergedSchema.parameters.properties.field2).toBeDefined();
    expect(mergedSchema.parameters.required).toEqual(["field1", "field2"]); // Union of required fields
  });
});