import { describe, it, expect } from "vitest";
import { DiffReport, SchemaDiffDetail } from "../src/schema/structured-tool-output-schema-diffing-v14";

describe("SchemaDiffingV14", () => {
  it("should correctly identify a type mismatch", () => {
    const diff: SchemaDiffDetail = {
      path: "some.field",
      diffType: "TypeMismatch",
      oldValue: "string",
      newValue: 123,
    };
    const report: DiffReport = { diffs: [diff] };
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].diffType).toBe("TypeMismatch");
  });

  it("should correctly identify a field addition", () => {
    const diff: SchemaDiffDetail = {
      path: "new.field",
      diffType: "FieldAdded",
      oldValue: undefined,
      newValue: "some value",
    };
    const report: DiffReport = { diffs: [diff] };
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].diffType).toBe("FieldAdded");
  });

  it("should correctly identify a field removal", () => {
    const diff: SchemaDiffDetail = {
      path: "old.field",
      diffType: "FieldRemoved",
      oldValue: "some value",
      newValue: undefined,
    };
    const report: DiffReport = { diffs: [diff] };
    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].diffType).toBe("FieldRemoved");
  });
});