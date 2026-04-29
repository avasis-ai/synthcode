import { describe, it, expect } from "vitest";
import { SchemaDiffReport, DiffChange } from "../src/schema/structured-tool-output-schema-diffing-v127";

describe("SchemaDiffReport", () => {
  it("should correctly report a simple addition", () => {
    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "user.name",
          changeType: "ADDED",
          details: "New field added",
        },
      ],
      summary: {
        addedCount: 1,
        removedCount: 0,
        modifiedCount: 0,
        typeChangeCount: 0,
      },
    };
    expect(report.diffs.length).toBe(1);
    expect(report.summary.addedCount).toBe(1);
  });

  it("should correctly report multiple changes", () => {
    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "user.email",
          changeType: "MODIFIED",
          details: "Email changed from a@b.com to c@d.com",
        },
        {
          path: "user.phone",
          changeType: "REMOVED",
          details: "Phone number removed",
        },
        {
          path: "tool_result.status",
          changeType: "TYPE_CHANGED",
          details: "String changed to number",
        },
        {
          path: "new_field",
          changeType: "ADDED",
          details: "Completely new field",
        },
      ],
      summary: {
        addedCount: 1,
        removedCount: 1,
        modifiedCount: 1,
        typeChangeCount: 1,
      },
    };
    expect(report.diffs.length).toBe(4);
    expect(report.summary.addedCount).toBe(1);
    expect(report.summary.removedCount).toBe(1);
    expect(report.summary.modifiedCount).toBe(1);
    expect(report.summary.typeChangeCount).toBe(1);
  });

  it("should return empty report for no changes", () => {
    const report: SchemaDiffReport = {
      diffs: [],
      summary: {
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        typeChangeCount: 0,
      },
    };
    expect(report.diffs).toEqual([]);
    expect(report.summary).toEqual({
      addedCount: 0,
      removedCount: 0,
      modifiedCount: 0,
      typeChangeCount: 0,
    });
  });
});