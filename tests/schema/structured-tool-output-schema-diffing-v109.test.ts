import { describe, it, expect } from "vitest";
import {
  SchemaField,
  SchemaDefinition,
  SchemaDiffReport,
} from "../src/schema/structured-tool-output-schema-diffing-v109";

describe("SchemaDiffingV109", () => {
  it("should correctly report differences when a field is missing in the new schema", () => {
    const oldSchema: SchemaDefinition = {
      id: {type: "string", required: true},
      name: {type: "string", required: false},
    };
    const newSchema: SchemaDefinition = {
      id: {type: "string", required: true},
    };

    const report = SchemaDiffReport.diff(oldSchema, newSchema);

    expect(report.missingFields).toEqual(["name"]);
    expect(report.addedFields).toEqual([]);
    expect(report.modifiedFields).toEqual([]);
  });

  it("should correctly report differences when a field is added in the new schema", () => {
    const oldSchema: SchemaDefinition = {
      id: {type: "string", required: true},
    };
    const newSchema: SchemaDefinition = {
      id: {type: "string", required: true},
      timestamp: {type: "number", required: false},
    };

    const report = SchemaDiffReport.diff(oldSchema, newSchema);

    expect(report.missingFields).toEqual([]);
    expect(report.addedFields).toEqual(["timestamp"]);
    expect(report.modifiedFields).toEqual([]);
  });

  it("should correctly report type changes for an existing field", () => {
    const oldSchema: SchemaDefinition = {
      count: {type: "number", required: false},
    };
    const newSchema: SchemaDefinition = {
      count: {type: "string", required: false},
    };

    const report = SchemaDiffReport.diff(oldSchema, newSchema);

    expect(report.missingFields).toEqual([]);
    expect(report.addedFields).toEqual([]);
    expect(report.modifiedFields).toHaveLength(1);
    expect(report.modifiedFields).toContainEqual({
      field: "count",
      oldType: "number",
      newType: "string",
    });
  });
});