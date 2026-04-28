import { describe, it, expect } from "vitest";
import { SchemaDiffReport } from "../src/schema/structured-output-schema-diffing-v2";

describe("SchemaDiffReport", () => {
  it("should correctly report when a field is added", () => {
    const report: SchemaDiffReport = {
      added: [{ path: "newField", description: "A newly added field" }],
      removed: [],
      changed: [],
      compatible: [],
    };
    expect(report.added).toHaveLength(1);
    expect(report.added[0].path).toBe("newField");
  });

  it("should correctly report when a field is removed", () => {
    const report: SchemaDiffReport = {
      added: [],
      removed: [{ path: "oldField", description: "This field is deprecated" }],
      changed: [],
      compatible: [],
    };
    expect(report.removed).toHaveLength(1);
    expect(report.removed[0].path).toBe("oldField");
  });

  it("should correctly report multiple types of changes", () => {
    const report: SchemaDiffReport = {
      added: [{ path: "newField", description: "Added" }],
      removed: [{ path: "oldField", description: "Removed" }],
      changed: [{ path: "typeChange", description: "Type changed" }],
      compatible: [{ path: "stableField", description: "Unchanged" }],
    };
    expect(report.added).toHaveLength(1);
    expect(report.removed).toHaveLength(1);
    expect(report.changed).toHaveLength(1);
    expect(report.compatible).toHaveLength(1);
  });
});