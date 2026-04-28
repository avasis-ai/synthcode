import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v101";

describe("SchemaDiffReport", () => {
  it("should correctly report added fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {
        newField: { description: "A new field", type: "string" },
      },
      removedFields: {},
      modifiedFields: {},
    };
    expect(report.addedFields["newField"]).toEqual({ description: "A new field", type: "string" });
  });

  it("should correctly report removed fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      removedFields: {
        oldField: { description: "An old field", type: "number" },
      },
      modifiedFields: {},
    };
    expect(report.removedFields["oldField"]).toEqual({ description: "An old field", type: "number" });
  });

  it("should correctly report modified fields", () => {
    const report: SchemaDiffReport = {
      addedFields: {},
      removedFields: {},
      modifiedFields: {
        changedField: { oldType: "string", newType: "boolean", description: "Changed type" },
      },
    };
    expect(report.modifiedFields["changedField"]).toEqual({ oldType: "string", newType: "boolean", description: "Changed type" });
  });
});