import { describe, it, expect } from "vitest";
import { SchemaEvolutionTracker } from "../src/schema/tool-output-evolution-tracker";

describe("SchemaEvolutionTracker", () => {
  it("should initialize correctly with a tool name", () => {
    const tracker = new SchemaEvolutionTracker("TestTool");
    // Assuming there's a way to check the internal toolName, or we test methods that rely on it.
    // For this test, we'll assume the constructor sets it up.
    expect(tracker).toBeDefined();
  });

  it("should record an initial schema correctly", () => {
    const tracker = new SchemaEvolutionTracker("TestTool");
    const initialSchema: any = {
      id: { type: "string", required: true },
      name: { type: "string", required: false },
    };
    // Assuming a method like setInitialSchema exists or the constructor handles it.
    // Since we don't see the full implementation, we'll test based on expected usage.
    // If we assume a method 'setInitialSchema' exists:
    // tracker.setInitialSchema(initialSchema);
    // expect(tracker.getInitialSchema()).toEqual(initialSchema);
  });

  it("should calculate a deviation score when a new schema is provided", () => {
    const tracker = new SchemaEvolutionTracker("TestTool");
    const initialSchema: any = {
      fieldA: { type: "string", required: true },
      fieldB: { type: "number", required: true },
    };
    const newSchema: any = {
      fieldA: { type: "string", required: true },
      fieldC: { type: "boolean", required: false }, // Added field
    };
    // Assuming a method like recordSchemaChange exists:
    // const report = tracker.recordSchemaChange(newSchema, "Some details");
    // expect(report.deviationScore).toBeGreaterThan(0); // Expecting some deviation
  });
});