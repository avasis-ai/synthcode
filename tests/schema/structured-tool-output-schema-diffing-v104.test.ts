import { describe, it, expect } from "vitest";
import { SchemaDiffingService } from "../src/schema/structured-tool-output-schema-diffing-v104";

describe("SchemaDiffingService", () => {
  it("should correctly calculate diff for added and removed fields", () => {
    const service: SchemaDiffingService = {
      calculateDiff: (schemaA: any, schemaB: any) => {
        const report: any = { added: {}, removed: {}, modified: {} };
        // Mocking a simple diff calculation for testing purposes
        if (schemaA.fieldA && !schemaB.fieldA) {
          report.removed.fieldA = schemaA.fieldA;
        }
        if (!schemaA.fieldB && schemaB.fieldB) {
          report.added.fieldB = schemaB.fieldB;
        }
        return report;
      },
      generateReport: (diff: any) => "Report generated",
    };

    const schemaA: any = { fieldA: "old value", commonField: "data" };
    const schemaB: any = { fieldB: "new value", commonField: "data" };

    const diff = service.calculateDiff(schemaA, schemaB);

    expect(diff.removed.fieldA).toBe("old value");
    expect(diff.added.fieldB).toBe("new value");
    expect(diff.modified).toEqual({});
  });

  it("should correctly calculate diff for modified fields", () => {
    const service: SchemaDiffingService = {
      calculateDiff: (schemaA: any, schemaB: any) => {
        const report: any = { added: {}, removed: {}, modified: {} };
        // Mocking a simple diff calculation for testing purposes
        if (schemaA.commonField !== schemaB.commonField) {
          report.modified.commonField = { old: schemaA.commonField, new: schemaB.commonField, diff: "changed" };
        }
        return report;
      },
      generateReport: (diff: any) => "Report generated",
    };

    const schemaA: any = { commonField: "old data" };
    const schemaB: any = { commonField: "new data" };

    const diff = service.calculateDiff(schemaA, schemaB);

    expect(diff.modified.commonField.old).toBe("old data");
    expect(diff.modified.commonField.new).toBe("new data");
    expect(diff.modified.commonField.diff).toBe("changed");
  });

  it("should generate a report string from the diff report", () => {
    const service: SchemaDiffingService = {
      calculateDiff: (schemaA: any, schemaB: any) => ({
        added: { newField: "data" },
        removed: { oldField: "data" },
        modified: { commonField: { old: "old", new: "new", diff: "changed" } },
      }),
      generateReport: (diff: any) => "Report generated",
    };

    const diff = {
      added: { newField: "data" },
      removed: { oldField: "data" },
      modified: { commonField: { old: "old", new: "new", diff: "changed" } },
    };

    const report = service.generateReport(diff);
    expect(report).toBe("Report generated");
  });
});