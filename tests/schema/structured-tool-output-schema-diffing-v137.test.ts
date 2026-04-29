import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v137";

describe("SchemaDiffReport", () => {
  it("should correctly report a schema with no changes", () => {
    const report: SchemaDiffReport = {
      summary: {
        compatible: true,
        totalChanges: 0,
        fieldChanges: {
          added: [],
          removed: [],
          typeChanges: [],
        },
        structuralIssues: [],
      },
      details: {},
    };
    expect(report.summary.compatible).toBe(true);
    expect(report.summary.totalChanges).toBe(0);
    expect(report.summary.fieldChanges.added).toEqual([]);
  });

  it("should report added, removed, and type-changed fields correctly", () => {
    const report: SchemaDiffReport = {
      summary: {
        compatible: false,
        totalChanges: 3,
        fieldChanges: {
          added: ["newField"],
          removed: ["oldField"],
          typeChanges: [
            { field: "someField", from: "string", to: "number" },
          ],
        },
        structuralIssues: ["Missing required field 'context'"],
      },
      details: {
        schemaA: {
          field1: "value",
          field2: "value",
        },
        schemaB: {
          field1: "value",
          field3: "value",
        },
      },
    };
    expect(report.summary.compatible).toBe(false);
    expect(report.summary.totalChanges).toBe(3);
    expect(report.summary.fieldChanges.added).toContain("newField");
    expect(report.summary.fieldChanges.removed).toContain("oldField");
    expect(report.summary.fieldChanges.typeChanges).toHaveLength(1);
    expect(report.summary.structuralIssues).toContain("Missing required field 'context'");
  });

  it("should handle an empty report structure", () => {
    const report: SchemaDiffReport = {
      summary: {
        compatible: true,
        totalChanges: 0,
        fieldChanges: {
          added: [],
          removed: [],
          typeChanges: [],
        },
        structuralIssues: [],
      },
      details: {},
    };
    expect(report).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(report.details).toEqual({});
  });
});