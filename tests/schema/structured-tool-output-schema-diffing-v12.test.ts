import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffer } from "../src/schema/structured-tool-output-schema-diffing-v12";

describe("StructuredToolOutputSchemaDiffer", () => {
  it("should correctly identify no difference between two identical schemas", () => {
    const currentSchema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };
    const expectedSchema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
      required: ["id", "name"],
    };

    const differ = new StructuredToolOutputSchemaDiffer(currentSchema, expectedSchema);
    const report = differ.diff();

    expect(report.isDifferent).toBe(false);
    expect(report.diffs).toEqual([]);
  });

  it("should detect a difference when a property is added", () => {
    const currentSchema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    };
    const expectedSchema: any = {
      type: "object",
      properties: {
        id: { type: "string" },
        newField: { type: "number" },
      },
      required: ["id", "newField"],
    };

    const differ = new StructuredToolOutputSchemaDiffer(currentSchema, expectedSchema);
    const report = differ.diff();

    expect(report.isDifferent).toBe(true);
    expect(report.diffs).toContain("Property 'newField' was added.");
  });

  it("should detect a difference when a property type changes", () => {
    const currentSchema: any = {
      type: "object",
      properties: {
        itemId: { type: "string" },
      },
      required: ["itemId"],
    };
    const expectedSchema: any = {
      type: "object",
      properties: {
        itemId: { type: "number" },
      },
      required: ["itemId"],
    };

    const differ = new StructuredToolOutputSchemaDiffer(currentSchema, expectedSchema);
    const report = differ.diff();

    expect(report.isDifferent).toBe(true);
    expect(report.diffs).toContain("Property 'itemId' type changed from 'string' to 'number'.");
  });
});