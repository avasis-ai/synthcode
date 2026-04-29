import { describe, it, expect } from "vitest";
import { SchemaDiff, SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v134";

describe("SchemaDiffReport", () => {
  it("should correctly generate diffs for added fields", () => {
    const diffReport: SchemaDiffReport = {
      diffs: [
        {
          field: "newField",
          diff: {
            added: { newField: "value" },
            removed: {},
            modified: {},
          },
        },
      ],
      summary: {
        addedCount: 1,
        removedCount: 0,
        modifiedCount: 0,
      },
    };
    expect(diffReport.diffs.length).toBe(1);
    expect(diffReport.summary.addedCount).toBe(1);
  });

  it("should correctly generate diffs for removed fields", () => {
    const diffReport: SchemaDiffReport = {
      diffs: [
        {
          field: "oldField",
          diff: {
            added: {},
            removed: { oldField: "value" },
            modified: {},
          },
        },
      ],
      summary: {
        addedCount: 0,
        removedCount: 1,
        modifiedCount: 0,
      },
    };
    expect(diffReport.diffs.length).toBe(1);
    expect(diffReport.summary.removedCount).toBe(1);
  });

  it("should correctly generate diffs for modified fields", () => {
    const diffReport: SchemaDiffReport = {
      diffs: [
        {
          field: "modifiedField",
          diff: {
            added: {},
            removed: {},
            modified: {
              type: "string",
              description: "Updated description",
              details: {
                old: "old value",
                new: "new value",
              },
            },
          },
        },
      ],
      summary: {
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 1,
      },
    };
    expect(diffReport.diffs.length).toBe(1);
    expect(diffReport.summary.modifiedCount).toBe(1);
  });
});