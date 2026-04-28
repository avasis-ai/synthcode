import { describe, it, expect } from "vitest";
import { SchemaDiffReport, SchemaDefinition } from "../src/schema/structured-tool-output-schema-diffing-v117";

describe("SchemaDiffReport", () => {
  it("should correctly report added fields", () => {
    const report: SchemaDiffReport = {
      added: [{ field: "newField", type: "string" }],
      removed: [],
      modified: [],
    };
    expect(report.added).toHaveLength(1);
    expect(report.added[0].field).toBe("newField");
  });

  it("should correctly report removed fields", () => {
    const report: SchemaDiffReport = {
      added: [],
      removed: [{ field: "oldField", reason: "deprecated" }],
      modified: [],
    };
    expect(report.removed).toHaveLength(1);
    expect(report.removed[0].field).toBe("oldField");
  });

  it("should correctly report modified fields", () => {
    const report: SchemaDiffReport = {
      added: [],
      removed: [],
      modified: [{ field: "name", oldType: "string", newType: "number" }],
    };
    expect(report.modified).toHaveLength(1);
    expect(report.modified[0].field).toBe("name");
    expect(report.modified[0].oldType).toBe("string");
    expect(report.modified[0].newType).toBe("number");
  });
});