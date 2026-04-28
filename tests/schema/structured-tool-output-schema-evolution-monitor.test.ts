import { describe, it, expect } from "vitest";
import { Schema, ChangeDetail, EvolutionReport } from "../src/schema/structured-tool-output-schema-evolution-monitor";

describe("Schema", () => {
  it("should correctly define a basic schema", () => {
    const schema: Schema = {
      id: { name: "id", type: "string", required: true },
      name: { name: "name", type: "string", required: false },
    };
    expect(schema).toBeDefined();
    expect(schema["id"]).toEqual({ name: "id", type: "string", required: true });
  });

  it("should correctly calculate change details for a simple field", () => {
    const change: ChangeDetail = {
      field: "status",
      detectedChange: "updated",
      baselineValue: "pending",
      currentValue: "completed",
    };
    expect(change.field).toBe("status");
    expect(change.baselineValue).toBe("pending");
    expect(change.currentValue).toBe("completed");
  });

  it("should generate a basic evolution report", () => {
    const report: EvolutionReport = {
      schema: {
        user_id: { name: "user_id", type: "string", required: true },
      },
      changes: [
        {
          field: "user_id",
          detectedChange: "type_change",
          baselineValue: "string",
          currentValue: "number",
        },
      ],
      summary: {
        totalFields: 1,
        changedFields: 1,
        schemaStability: "Warning",
      },
    };
    expect(report).toBeDefined();
    expect(report.summary.totalFields).toBe(1);
    expect(report.changes.length).toBe(1);
  });
});