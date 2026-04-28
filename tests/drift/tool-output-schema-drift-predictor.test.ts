import { describe, it, expect } from "vitest";
import { ToolOutputSchemaDriftPredictor } from "../src/drift/tool-output-schema-drift-predictor";
import { ToolOutputSchema, ToolOutputSample } from "../src/drift/types";

describe("ToolOutputSchemaDriftPredictor", () => {
  it("should calculate a high stability score when schema and samples are consistent", () => {
    const schema: ToolOutputSchema = {
      name: "testTool",
      description: "A test tool",
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string" },
        },
        required: ["id", "status"],
      },
    };
    const samples: ToolOutputSample[] = [
      { id: "1", status: "SUCCESS" },
      { id: "2", status: "FAILURE" },
    ];
    const predictor = new ToolOutputSchemaDriftPredictor();
    const report = predictor.predictDrift(schema, samples);

    expect(report.overallStabilityScore).toBeGreaterThan(0.9);
    expect(report.predictedDrifts.length).toBe(0);
  });

  it("should detect drift when a required field is missing in samples", () => {
    const schema: ToolOutputSchema = {
      name: "testTool",
      description: "A test tool",
      outputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
          optionalField: { type: "string" },
        },
        required: ["id"],
      },
    };
    const samples: ToolOutputSample[] = [
      { id: "1" },
      { id: "2" },
    ];
    const predictor = new ToolOutputSchemaDriftPredictor();
    const report = predictor.predictDrift(schema, samples);

    expect(report.overallStabilityScore).toBeLessThan(0.8);
    expect(report.predictedDrifts.length).toBeGreaterThanOrEqual(1);
    const driftReport = report.predictedDrifts.find(d => d.fieldName === "optionalField");
    expect(driftReport).toBeDefined();
    expect(driftReport!.suggestedAction).toBe("Make Optional");
  });

  it("should suggest monitoring when a field type changes significantly", () => {
    const schema: ToolOutputSchema = {
      name: "testTool",
      description: "A test tool",
      outputSchema: {
        type: "object",
        properties: {
          count: { type: "number" },
          name: { type: "string" },
        },
        required: ["count", "name"],
      },
    };
    const samples: ToolOutputSample[] = [
      { count: 10, name: "A" },
      { count: "20", name: "B" }, // Type drift: number -> string
    ];
    const predictor = new ToolOutputSchemaDriftPredictor();
    const report = predictor.predictDrift(schema, samples);

    expect(report.overallStabilityScore).toBeLessThan(0.9);
    expect(report.predictedDrifts.length).toBeGreaterThanOrEqual(1);
    const driftReport = report.predictedDrifts.find(d => d.fieldName === "count");
    expect(driftReport).toBeDefined();
    expect(driftReport!.suggestedAction).toBe("Monitor");
  });
});