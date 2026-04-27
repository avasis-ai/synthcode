import { describe, it, expect } from "vitest";
import { ToolOutputSchemaDriftDetector } from "../src/drift/tool-output-schema-drift-detector";

describe("ToolOutputSchemaDriftDetector", () => {
  it("should detect no drift when profiles are identical", () => {
    const detector = new ToolOutputSchemaDriftDetector();
    const profileA: Record<string, any> = {
      output_field_1: { type: "number", mean: 1.0, stdDev: 0.5, count: 10 },
      output_field_2: { type: "string", frequencies: new Map([["A", 2], ["B", 3]]), totalCount: 5 },
    };
    const profileB: Record<string, any> = {
      output_field_1: { type: "number", mean: 1.0, stdDev: 0.5, count: 10 },
      output_field_2: { type: "string", frequencies: new Map([["A", 2], ["B", 3]]), totalCount: 5 },
    };

    const drift = detector.detectDrift(profileA, profileB);
    expect(drift).toEqual({});
  });

  it("should detect drift when a field is missing in the new profile", () => {
    const detector = new ToolOutputSchemaDriftDetector();
    const profileA: Record<string, any> = {
      field_present: { type: "number", mean: 1.0, stdDev: 0.5, count: 10 },
    };
    const profileB: Record<string, any> = {};

    const drift = detector.detectDrift(profileA, profileB);
    expect(drift).toHaveProperty("field_present");
    expect(drift.field_present).toEqual({
      severity: "High",
      reason: "Field missing in new profile",
    });
  });

  it("should detect drift when a field type changes", () => {
    const detector = new ToolOutputSchemaDriftDetector();
    const profileA: Record<string, any> = {
      field_type_change: { type: "number", mean: 1.0, stdDev: 0.5, count: 10 },
    };
    const profileB: Record<string, any> = {
      field_type_change: { type: "string", frequencies: new Map([["X", 1]]), totalCount: 1 },
    };

    const drift = detector.detectDrift(profileA, profileB);
    expect(drift).toHaveProperty("field_type_change");
    expect(drift.field_type_change).toEqual({
      severity: "High",
      reason: "Type mismatch",
    });
  });
});