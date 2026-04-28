import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffingV118 } from "../src/schema/structured-tool-output-schema-diffing-v118";

describe("StructuredToolOutputSchemaDiffingV118", () => {
  const diffingService = new StructuredToolOutputSchemaDiffingV118();

  it("should return an empty report when schemas are identical", () => {
    const oldSchema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["name", "age"],
    };
    const newSchema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "integer" },
      },
      required: ["name", "age"],
    };

    const report = diffingService.diffSchemas(oldSchema, newSchema);
    expect(report.diffs).toHaveLength(0);
    expect(report.summary.hasChanges).toBe(false);
  });

  it("should detect a missing required property", () => {
    const oldSchema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name", "email"],
    };
    const newSchema: any = {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
      required: ["name"],
    };

    const report = diffingService.diffSchemas(oldSchema, newSchema);
    expect(report.diffs).toHaveLength(1);
    const diff = report.diffs[0];
    expect(diff.severity).toBe("ERROR");
    expect(diff.message).toContain("Missing required property: email");
    expect(report.summary.hasChanges).toBe(true);
  });

  it("should detect a changed property type", () => {
    const oldSchema: any = {
      type: "object",
      properties: {
        id: { type: "integer" },
      },
      required: ["id"],
    };
    const newSchema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };

    const report = diffingService.diffSchemas(oldSchema, newSchema);
    expect(report.diffs).toHaveLength(1);
    const diff = report.diffs[0];
    expect(diff.severity).toBe("WARNING");
    expect(diff.message).toContain("Property 'id' type changed from integer to string");
    expect(report.summary.hasChanges).toBe(true);
  });
});