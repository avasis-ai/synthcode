import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v11";

describe("SchemaDiffReport", () => {
  it("should correctly report added fields", () => {
    const report: SchemaDiffReport = {
      Added: {
        newField: { description: "A new field", type: "string" },
      },
      Removed: {},
      ChangedType: {},
      SemanticChange: {},
    };
    expect(report.Added).toHaveProperty("newField");
    expect(report.Added.newField.description).toBe("A new field");
  });

  it("should correctly report removed fields", () => {
    const report: SchemaDiffReport = {
      Added: {},
      Removed: {
        oldField: { description: "An old field", type: "number" },
      },
      ChangedType: {},
      SemanticChange: {},
    };
    expect(report.Removed).toHaveProperty("oldField");
    expect(report.Removed.oldField.type).toBe("number");
  });

  it("should correctly report type changes", () => {
    const report: SchemaDiffReport = {
      Added: {},
      Removed: {},
      ChangedType: {
        field: { oldType: "string", newType: "boolean", description: "Type changed" },
      },
      SemanticChange: {},
    };
    expect(report.ChangedType).toHaveProperty("field");
    expect(report.ChangedType.field.oldType).toBe("string");
    expect(report.ChangedType.field.newType).toBe("boolean");
  });
});