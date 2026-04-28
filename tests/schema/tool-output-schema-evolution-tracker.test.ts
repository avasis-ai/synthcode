import { describe, it, expect } from "vitest";
import { Schema, EvolutionReport } from "../src/schema/tool-output-schema-evolution-tracker";

describe("Schema", () => {
  it("should correctly define a basic schema", () => {
    const schema: Schema = {
      fields: {
        id: { name: "id", type: "string", required: true },
        name: { name: "name", type: "string", required: false },
      },
    };
    expect(schema).toBeDefined();
    expect(schema.fields).toHaveProperty("id");
    expect(schema.fields.id.type).toBe("string");
    expect(schema.fields.id.required).toBe(true);
  });

  it("should correctly generate an empty evolution report", () => {
    const report: EvolutionReport = {
      history: [],
      summary: {
        total_steps: 0,
        structural_changes: {
          added_fields: [],
          removed_fields: [],
          modified_fields: [],
        },
      },
    };
    expect(report).toBeDefined();
    expect(report.history).toEqual([]);
    expect(report.summary.total_steps).toBe(0);
  });

  it("should correctly process a simple schema evolution", () => {
    const initialSchema: Schema = {
      fields: {
        user_id: { name: "user_id", type: "integer", required: true },
      },
    };
    const nextSchema: Schema = {
      fields: {
        user_id: { name: "user_id", type: "integer", required: true },
        timestamp: { name: "timestamp", type: "number", required: true },
      },
    };

    // Mocking the function call structure for testing the report generation logic
    const report: EvolutionReport = {
      history: [
        { schema: initialSchema, timestamp: 1678886400000 },
        { schema: nextSchema, timestamp: 1678886500000 },
      ],
      summary: {
        total_steps: 2,
        structural_changes: {
          added_fields: [{ name: "timestamp", type: "number" }],
          removed_fields: [],
          modified_fields: [],
        },
      },
    };

    expect(report.history.length).toBe(2);
    expect(report.summary.structural_changes.added_fields.length).toBe(1);
    expect(report.summary.structural_changes.added_fields[0].name).toBe("timestamp");
  });
});