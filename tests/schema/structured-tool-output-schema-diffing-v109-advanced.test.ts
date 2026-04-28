import { describe, it, expect } from "vitest";
import {
  SchemaDiff,
  SchemaDiffReport,
  SchemaDefinition,
} from "../src/schema/structured-tool-output-schema-diffing-v109-advanced";

describe("SchemaDiffReport generation", () => {
  it("should generate correct diffs for simple type changes", () => {
    const oldSchema: SchemaDefinition = {
      type: "object";
      properties: {
        id: {type: "string"},
        count: {type: "integer"},
      },
    };
    const newSchema: SchemaDefinition = {
      type: "object";
      properties: {
        id: {type: "string"},
        count: {type: "number"}, // Changed from integer to number
      },
    };

    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "properties.count",
          type: "type_mismatch",
          oldSchema: {type: "integer"},
          newSchema: {type: "number"},
          suggestion: "Consider using 'number' type for consistency.",
        } as SchemaDiff,
      ],
      summary: "One type mismatch found.",
      actionableSteps: ["Update 'count' property type from integer to number."],
    };

    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].type).toBe("type_mismatch");
    expect(report.summary).toContain("One type mismatch found.");
  });

  it("should detect added and removed properties", () => {
    const oldSchema: SchemaDefinition = {
      type: "object";
      properties: {
        name: {type: "string"},
        createdAt: {type: "string"},
      },
    };
    const newSchema: SchemaDefinition = {
      type: "object";
      properties: {
        name: {type: "string"},
        updatedAt: {type: "string"}, // Added
      },
    };

    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "properties.createdAt",
          type: "removed",
          oldSchema: {type: "string"},
        } as SchemaDiff,
        {
          path: "properties.updatedAt",
          type: "added",
          newSchema: {type: "string"},
        } as SchemaDiff,
      ],
      summary: "Two structural changes detected.",
      actionableSteps: ["Remove 'createdAt' property.", "Add 'updatedAt' property."],
    };

    expect(report.diffs.length).toBe(2);
    expect(report.diffs.some(d => d.path === "properties.createdAt" && d.type === "removed")).toBe(true);
    expect(report.diffs.some(d => d.path === "properties.updatedAt" && d.type === "added")).toBe(true);
  });

  it("should handle optionality changes correctly", () => {
    const oldSchema: SchemaDefinition = {
      type: "object";
      properties: {
        optionalField: {type: "string", required: true},
      },
    };
    const newSchema: SchemaDefinition = {
      type: "object";
      properties: {
        optionalField: {type: "string", required: false}, // Changed from required to optional
      },
    };

    const report: SchemaDiffReport = {
      diffs: [
        {
          path: "properties.optionalField",
          type: "optionality_change",
          oldSchema: {type: "string", required: true},
          newSchema: {type: "string", required: false},
          suggestion: "The field is now optional. Review if this change is intentional.",
        } as SchemaDiff,
      ],
      summary: "One optionality change detected.",
      actionableSteps: ["Update required status for 'optionalField'."],
    };

    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0].type).toBe("optionality_change");
    expect(report.diffs[0].suggestion).toContain("optional");
  });
});