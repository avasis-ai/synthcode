import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffing } from "../src/schema/structured-tool-output-schema-diffing-v116";

describe("StructuredToolOutputSchemaDiffing", () => {
  it("should calculate an empty diff when schemas are identical", () => {
    const schemaA: any = { type: "object", properties: { id: { type: "string" } }, required: ["id"] };
    const schemaB: any = { type: "object", properties: { id: { type: "string" } }, required: ["id"] };
    const diffing = new StructuredToolOutputSchemaDiffing();
    const diff = diffing.calculateDiff(schemaA, schemaB);

    // Basic check to ensure the structure is returned and properties match (simplified check)
    expect(diff).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      description: "",
      allOf: [],
      oneOf: [],
      anyOf: [],
      items: null,
      additionalProperties: null,
    });
  });

  it("should detect a missing required property", () => {
    const schemaA: any = { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id", "name"] };
    const schemaB: any = { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id"] };
    const diffing = new StructuredToolOutputSchemaDiffing();
    const diff = diffing.calculateDiff(schemaA, schemaB);

    // Check if 'name' is marked as removed or if the required array is smaller
    expect(diff.required).toEqual(["id"]);
  });

  it("should detect a property type change", () => {
    const schemaA: any = { type: "object", properties: { id: { type: "string" } }, required: ["id"] };
    const schemaB: any = { type: "object", properties: { id: { type: "number" } }, required: ["id"] };
    const diffing = new StructuredToolOutputSchemaDiffing();
    const diff = diffing.calculateDiff(schemaA, schemaB);

    // Check if the property diff for 'id' reflects the type change (assuming the implementation handles this)
    expect(diff.properties["id"]).toEqual({ type: "number" });
  });
});