import { describe, it, expect } from "vitest";
import { SchemaDiffReport, SchemaDefinition } from "../src/schema/structured-tool-output-schema-diffing-v119";

describe("SchemaDiffReport", () => {
  it("should correctly report a type mismatch", () => {
    const report: SchemaDiffReport = {
      path: "user.name",
      diffs: [
        {
          type: "TypeMismatch",
          message: "Expected string but found number",
          details: { expected: "string", actual: "number" },
        },
      ],
    };
    expect(report.path).toBe("user.name");
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].type).toBe("TypeMismatch");
  });

  it("should correctly report a required field removal", () => {
    const report: SchemaDiffReport = {
      path: "user.email",
      diffs: [
        {
          type: "RequiredFieldRemoved",
          message: "Field 'email' is no longer required",
        },
      ],
    };
    expect(report.path).toBe("user.email");
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].type).toBe("RequiredFieldRemoved");
  });

  it("should handle multiple diff types in one report", () => {
    const report: SchemaDiffReport = {
      path: "data",
      diffs: [
        {
          type: "ValueChange",
          message: "Value changed from 'old' to 'new'",
        },
        {
          type: "NestedStructureChanged",
          message: "Structure changed in 'details'",
          details: { old: {}, new: {} },
        },
      ],
    };
    expect(report.path).toBe("data");
    expect(report.diffs.length).toBe(2);
    expect(report.diffs.some(d => d.type === "ValueChange")).toBeTruthy();
    expect(report.diffs.some(d => d.type === "NestedStructureChanged")).toBeTruthy();
  });
});