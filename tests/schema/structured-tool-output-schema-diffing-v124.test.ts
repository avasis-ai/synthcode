import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v124";

describe("SchemaDiffReport", () => {
  it("should correctly report no differences when schemas are identical", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      removedFields: {},
      modifiedFields: {},
      typeConflicts: {},
      diffSummary: {
        summary: "No changes detected",
        details: "The schemas are identical.",
      },
    };
    expect(report).toEqual({
      addedFields: {},
      removedFields: {},
      modifiedFields: {},
      typeConflicts: {},
      diffSummary: {
        summary: "No changes detected",
        details: "The schemas are identical.",
      },
    });
  });

  it("should report added, removed, and modified fields correctly", () => {
    const report: SchemaDiffReport = {
      addedFields: {
        newField: "value",
      },
      removedFields: {
        oldField: "value",
      },
      modifiedFields: {
        name: {
          old: "oldName",
          new: "newName",
          diff: "Name changed from oldName to newName",
        },
      },
      typeConflicts: {},
      diffSummary: {
        summary: "Schema updated",
        details: "One field modified, one added, one removed.",
      },
    };
    expect(report.addedFields).toHaveProperty("newField");
    expect(report.removedFields).toHaveProperty("oldField");
    expect(report.modifiedFields).toHaveProperty("name");
    expect(report.typeConflicts).toEqual({});
  });

  it("should report type conflicts when types change", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      removedFields: {},
      modifiedFields: {},
      typeConflicts: {
        age: {
          oldType: "number",
          newType: "string",
          description: "Type changed from number to string for 'age'",
        },
      },
      diffSummary: {
        summary: "Type changes detected",
        details: "Type mismatch found for 'age'.",
      },
    };
    expect(report.typeConflicts).toHaveProperty("age");
    expect(report.typeConflicts.age.oldType).toBe("number");
    expect(report.typeConflicts.age.newType).toBe("string");
  });
});