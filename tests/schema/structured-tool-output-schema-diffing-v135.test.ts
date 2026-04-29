import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v135";

describe("StructuredToolOutputSchemaDiffer", () => {
  const differ = new StructuredToolOutputSchemaDiffer();

  it("should return an empty array when schemas are identical", () => {
    const oldSchema = {
      name: "test",
      type: "object",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };
    const newSchema = {
      name: "test",
      type: "object",
      properties: {
        id: { type: "string" },
        value: { type: "number" },
      },
    };
    const diff = differ.diffSchemas(oldSchema, newSchema);
    expect(diff).toEqual([]);
  });

  it("should detect a missing property in the new schema", () => {
    const oldSchema = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
        optionalField: { type: "boolean" },
      },
    };
    const newSchema = {
      type: "object",
      properties: {
        requiredField: { type: "string" },
      },
    };
    const diff = differ.diffSchemas(oldSchema, newSchema);
    expect(diff.length).toBeGreaterThan(0);
    const missingPropDiff = diff.find(d => d.path.includes("optionalField"));
    expect(missingPropDiff).toBeDefined();
    expect(missingPropDiff?.severity).toBe("WARNING");
    expect(missingPropDiff?.description).toContain("is missing in the new schema");
  });

  it("should detect a changed type for a property", () => {
    const oldSchema = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        count: { type: "number" },
      },
    };
    const newSchema = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        count: { type: "string" },
      },
    };
    const diff = differ.diffSchemas(oldSchema, newSchema);
    expect(diff.length).toBeGreaterThan(0);
    const typeChangeDiff = diff.find(d => d.path.includes("count"));
    expect(typeChangeDiff).toBeDefined();
    expect(typeChangeDiff?.severity).toBe("ERROR");
    expect(typeChangeDiff?.description).toContain("type changed from \"number\" to \"string\"");
  });
});