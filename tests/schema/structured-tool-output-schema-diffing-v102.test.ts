import { describe, it, expect } from "vitest";
import { SchemaDiffingUtility } from "../src/schema/structured-tool-output-schema-diffing-v102";

describe("SchemaDiffingUtility", () => {
  it("should report correctly when one property is added", () => {
    const schemaA = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
      },
    };

    const report = SchemaDiffingUtility.diffSchemas(schemaA, schemaB);
    expect(report.summary.added).toBe(1);
    expect(report.summary.removed).toBe(0);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].path).toBe("properties.email");
    expect(report.diffs[0].changeType).toBe("ADDED");
  });

  it("should report correctly when one property is removed", () => {
    const schemaA = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        optionalField: { type: "boolean" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    };

    const report = SchemaDiffingUtility.diffSchemas(schemaA, schemaB);
    expect(report.summary.added).toBe(0);
    expect(report.summary.removed).toBe(1);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].path).toBe("properties.optionalField");
    expect(report.diffs[0].changeType).toBe("REMOVED");
  });

  it("should report type mismatch when an existing property changes type", () => {
    const schemaA = {
      type: "object",
      properties: {
        itemId: { type: "integer" },
        isActive: { type: "boolean" },
      },
    };
    const schemaB = {
      type: "object",
      properties: {
        itemId: { type: "string" },
        isActive: { type: "boolean" },
      },
    };

    const report = SchemaDiffingUtility.diffSchemas(schemaA, schemaB);
    expect(report.summary.added).toBe(0);
    expect(report.summary.removed).toBe(0);
    expect(report.summary.typeMismatches).toBe(1);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].path).toBe("properties.itemId");
    expect(report.diffs[0].changeType).toBe("TYPE_MISMATCH");
  });
});