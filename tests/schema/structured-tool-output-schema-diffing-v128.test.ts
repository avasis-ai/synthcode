import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaDiffingV128 } from "../src/schema/structured-tool-output-schema-diffing-v128";
import { Schema, SchemaDiffReport } from "../src/schema/types";

describe("StructuredToolOutputSchemaDiffingV128", () => {
  const diffingService = new StructuredToolOutputSchemaDiffingV128();

  it("should return an empty report when schemas are identical", () => {
    const schemaV1: Schema = {
      name: { type: "string", description: "Tool name" },
      input: { type: "object", properties: { id: { type: "string" } } },
    };
    const schemaV2: Schema = {
      name: { type: "string", description: "Tool name" },
      input: { type: "object", properties: { id: { type: "string" } } },
    };

    const report: SchemaDiffReport = diffingService.compareSchemas(schemaV1, schemaV2);
    expect(report.diffs).toEqual([]);
    expect(report.isDifferent).toBe(false);
  });

  it("should detect added fields between schema versions", () => {
    const schemaV1: Schema = {
      name: { type: "string" },
    };
    const schemaV2: Schema = {
      name: { type: "string" },
      description: { type: "string" },
    };

    const report: SchemaDiffReport = diffingService.compareSchemas(schemaV1, schemaV2);
    expect(report.isDifferent).toBe(true);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].field).toBe("description");
    expect(report.diffs[0].changeType).toBe("ADDED");
  });

  it("should detect removed fields between schema versions", () => {
    const schemaV1: Schema = {
      name: { type: "string" },
      optionalField: { type: "boolean" },
    };
    const schemaV2: Schema = {
      name: { type: "string" },
    };

    const report: SchemaDiffReport = diffingService.compareSchemas(schemaV1, schemaV2);
    expect(report.isDifferent).toBe(true);
    expect(report.diffs).toHaveLength(1);
    expect(report.diffs[0].field).toBe("optionalField");
    expect(report.diffs[0].changeType).toBe("REMOVED");
  });
});