import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v113-advanced";

describe("SchemaDiffReport", () => {
  it("should return an empty report when no differences are found", () => {
    const report: SchemaDiffReport = { diffs: [] };
    expect(report).toBeDefined();
    expect(report.diffs).toEqual([]);
  });

  it("should correctly report a type mismatch difference", () => {
    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "some.field",
          diffType: "TYPE_MISMATCH",
          oldValue: "string",
          newValue: 123,
          message: "Expected string but got number",
        },
      ],
    };
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].diffType).toBe("TYPE_MISMATCH");
    expect(report.diffs[0].path).toBe("some.field");
  });

  it("should accumulate multiple different types of structural changes", () => {
    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "user.name",
          diffType: "FIELD_REMOVED",
          oldValue: "John Doe",
          newValue: undefined,
          message: "Field 'user.name' was removed.",
        },
        {
          path: "tool.output",
          diffType: "FIELD_ADDED",
          oldValue: undefined,
          newValue: { result: "Success" },
          message: "New field 'tool.output' added.",
        },
        {
          path: "metadata.version",
          diffType: "VALUE_CHANGE",
          oldValue: 1,
          newValue: 2,
          message: "Version changed from 1 to 2.",
        },
      ],
    };
    expect(report.diffs.length).toBe(3);
    expect(report.diffs.some(d => d.diffType === "FIELD_REMOVED")).toBe(true);
    expect(report.diffs.some(d => d.diffType === "FIELD_ADDED")).toBe(true);
    expect(report.diffs.some(d => d.diffType === "VALUE_CHANGE")).toBe(true);
  });
});