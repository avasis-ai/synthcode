import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v136";

describe("SchemaDiffReport", () => {
  it("should correctly report added fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {
        newField: { description: "A new field", type: "string" },
      },
      deletedFields: {},
      modifiedFields: {},
    };
    expect(report.addedFields).toHaveProperty("newField");
    expect(report.addedFields.newField.description).toBe("A new field");
  });

  it("should correctly report deleted fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      deletedFields: {
        oldField: { description: "An old field", type: "number" },
      },
      modifiedFields: {},
    };
    expect(report.deletedFields).toHaveProperty("oldField");
    expect(report.deletedFields.oldField.type).toBe("number");
  });

  it("should correctly report modified fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      deletedFields: {},
      modifiedFields: {
        fieldName: {
          oldType: "string",
          newType: "boolean",
          description: "Changed type",
          diff: { type: "typeChange" },
        },
      },
    };
    expect(report.modifiedFields).toHaveProperty("fieldName");
    expect(report.modifiedFields.fieldName.oldType).toBe("string");
    expect(report.modifiedFields.fieldName.diff.type).toBe("typeChange");
  });
});