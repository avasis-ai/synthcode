import { describe, it, expect } from "vitest";
import { ToolOutputSchemaDriftMonitor } from "../src/drift/tool-output-schema-drift-monitor";

describe("ToolOutputSchemaDriftMonitor", () => {
  it("should calculate correct metrics for a stable schema", () => {
    const expectedSchema = {
      user_id: { type: "string", required: true },
      username: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const monitor = new ToolOutputSchemaDriftMonitor(expectedSchema);

    const toolOutput = [
      { user_id: "1", username: "alice", age: 30 },
      { user_id: "2", username: "bob", age: 25 },
      { user_id: "3", username: "charlie", age: null },
    ];

    const report = monitor.generateReport(toolOutput);

    expect(report.isDrifting).toBe(false);
    expect(report.driftScore).toBe(0);
    expect(report.schema.user_id.presentCount).toBe(3);
    expect(report.schema.user_id.typeCounts).toEqual({ string: 3 });
    expect(report.schema.user_id.nullCount).toBe(0);
    expect(report.schema.age.presentCount).toBe(3);
    expect(report.schema.age.typeCounts).toEqual({ number: 2, "null": 1 });
  });

  it("should detect drift when a field is missing", () => {
    const expectedSchema = {
      user_id: { type: "string", required: true },
      username: { type: "string", required: true },
    };
    const monitor = new ToolOutputSchemaDriftMonitor(expectedSchema);

    const toolOutput = [
      { user_id: "1", username: "alice" },
      { user_id: "2" }, // Missing username
    ];

    const report = monitor.generateReport(toolOutput);

    expect(report.isDrifting).toBe(true);
    expect(report.details).toHaveProperty("username");
    expect(report.details.username.deviation).toBe(1);
    expect(report.details.username.reason).toContain("missing");
  });

  it("should detect drift when a field type changes unexpectedly", () => {
    const expectedSchema = {
      user_id: { type: "string", required: true },
      age: { type: "number", required: false },
    };
    const monitor = new ToolOutputSchemaDriftMonitor(expectedSchema);

    const toolOutput = [
      { user_id: "1", age: 30 },
      { user_id: "2", age: "twenty-five" }, // Type change from number to string
    ];

    const report = monitor.generateReport(toolOutput);

    expect(report.isDrifting).toBe(true);
    expect(report.details).toHaveProperty("age");
    expect(report.details.age.deviation).toBe(1);
    expect(report.details.age.reason).toContain("type mismatch");
  });
});