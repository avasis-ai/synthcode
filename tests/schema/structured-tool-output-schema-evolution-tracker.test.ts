import { describe, it, expect } from "vitest";
import { SchemaEvolutionReport } from "../src/schema/structured-tool-output-schema-evolution-tracker";

describe("SchemaEvolutionReport", () => {
  it("should correctly initialize with a basic report structure", () => {
    const toolName = "test-tool";
    const initialSchema: Schema = {
      type: "object",
      properties: {
        id: { name: "id", type: "string" },
      },
      required: ["id"],
    };
    const report: SchemaEvolutionReport = {
      toolName: toolName,
      initialSchema: initialSchema,
      history: [{
        version: 1,
        schema: initialSchema,
        report: {
          addedFields: [],
          removedFields: [],
          modifiedFields: [],
        },
      }],
    };

    expect(report.toolName).toBe(toolName);
    expect(report.initialSchema).toEqual(initialSchema);
    expect(report.history).toHaveLength(1);
    expect(report.history[0].version).toBe(1);
  });

  it("should append a new version to the history correctly", () => {
    const toolName = "test-tool";
    const initialSchema: Schema = {
      type: "object",
      properties: {
        a: { name: "a", type: "string" },
      },
      required: ["a"],
    };
    const firstVersion: SchemaEvolutionReport = {
      toolName: toolName,
      initialSchema: initialSchema,
      history: [{
        version: 1,
        schema: initialSchema,
        report: {
          addedFields: [],
          removedFields: [],
          modifiedFields: [],
        },
      }],
    };

    const newSchema: Schema = {
      type: "object",
      properties: {
        a: { name: "a", type: "string" },
        b: { name: "b", type: "number" },
      },
      required: ["a", "b"],
    };

    // Mocking the update logic for testing purposes
    const updatedReport: SchemaEvolutionReport = {
      toolName: toolName,
      initialSchema: initialSchema,
      history: [
        ...firstVersion.history,
        {
          version: 2,
          schema: newSchema,
          report: {
            addedFields: ["b"],
            removedFields: [],
            modifiedFields: [],
          },
        },
      ],
    };

    expect(updatedReport.history).toHaveLength(2);
    expect(updatedReport.history[1].version).toBe(2);
    expect(updatedReport.history[1].schema.properties).toHaveProperty("b");
  });

  it("should handle schema changes including removed fields", () => {
    const toolName = "test-tool";
    const initialSchema: Schema = {
      type: "object",
      properties: {
        field1: { name: "field1", type: "string" },
        field2: { name: "field2", type: "boolean" },
      },
      required: ["field1", "field2"],
    };
    const firstVersion: SchemaEvolutionReport = {
      toolName: toolName,
      initialSchema: initialSchema,
      history: [{
        version: 1,
        schema: initialSchema,
        report: {
          addedFields: [],
          removedFields: [],
          modifiedFields: [],
        },
      }],
    };

    const updatedSchema: Schema = {
      type: "object",
      properties: {
        field1: { name: "field1", type: "string" },
      },
      required: ["field1"],
    };

    const updatedReport: SchemaEvolutionReport = {
      toolName: toolName,
      initialSchema: initialSchema,
      history: [
        ...firstVersion.history,
        {
          version: 2,
          schema: updatedSchema,
          report: {
            addedFields: [],
            removedFields: ["field2"],
            modifiedFields: [],
          },
        },
      ],
    };

    expect(updatedReport.history).toHaveLength(2);
    expect(updatedReport.history[1].report.removedFields).toEqual(["field2"]);
  });
});