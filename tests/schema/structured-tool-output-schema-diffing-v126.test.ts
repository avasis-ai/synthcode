import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-tool-output-schema-diffing-v126";

describe("SchemaDiffReport", () => {
  it("should correctly report a type change", () => {
    const report: SchemaDiffReport = {
      path: "some.field",
      diff: {
        type: "type",
        old: "string",
        new: "number",
      },
    };
    expect(report.path).toBe("some.field");
    expect(report.diff.type).toBe("type");
    expect(report.diff.old).toBe("string");
    expect(report.diff.new).toBe("number");
  });

  it("should correctly report a required field change", () => {
    const report: SchemaDiffReport = {
      path: "another.field",
      diff: {
        type: "required",
        old: false,
        new: true,
      },
    };
    expect(report.path).toBe("another.field");
    expect(report.diff.type).toBe("required");
    expect(report.diff.old).toBe(false);
    expect(report.diff.new).toBe(true);
  });

  it("should correctly report a structure change", () => {
    const report: SchemaDiffReport = {
      path: "complex.object",
      diff: {
        type: "structure",
        old: { a: 1, b: "old" },
        new: { a: 1, b: "new" },
      },
    };
    expect(report.path).toBe("complex.object");
    expect(report.diff.type).toBe("structure");
    expect(report.diff.old).toEqual({ a: 1, b: "old" });
    expect(report.diff.new).toEqual({ a: 1, b: "new" });
  });
});