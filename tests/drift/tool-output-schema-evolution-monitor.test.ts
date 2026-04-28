import { describe, it, expect } from "vitest";
import { ToolOutputSchemaEvolutionMonitor } from "../src/drift/tool-output-schema-evolution-monitor";

describe("ToolOutputSchemaEvolutionMonitor", () => {
  it("should detect no drift when schemas are identical", () => {
    const initialSchema: Record<string, any> = {
      toolName: { name: "toolName", type: "string", isRequired: true },
      paramA: { name: "paramA", type: "number", isRequired: false },
    };
    const monitor = new ToolOutputSchemaEvolutionMonitor();
    monitor.recordSchema(initialSchema);
    const report = monitor.checkSchema(initialSchema);

    expect(report.driftDetected).toBe(false);
    expect(report.severity).toBe("None");
  });

  it("should detect minor drift when a non-required field is added", () => {
    const initialSchema: Record<string, any> = {
      toolName: { name: "toolName", type: "string", isRequired: true },
      paramA: { name: "paramA", type: "number", isRequired: false },
    };
    const monitor = new ToolOutputSchemaEvolutionMonitor();
    monitor.recordSchema(initialSchema);

    const driftedSchema: Record<string, any> = {
      toolName: { name: "toolName", type: "string", isRequired: true },
      paramA: { name: "paramA", type: "number", isRequired: false },
      newParam: { name: "newParam", type: "boolean", isRequired: false },
    };
    const report = monitor.checkSchema(driftedSchema);

    expect(report.driftDetected).toBe(true);
    expect(report.severity).toBe("Minor");
    expect(report.details).toContain("Added field: newParam");
  });

  it("should detect severe drift when a required field is removed", () => {
    const initialSchema: Record<string, any> = {
      toolName: { name: "toolName", type: "string", isRequired: true },
      paramA: { name: "paramA", type: "number", isRequired: true },
    };
    const monitor = new ToolOutputSchemaEvolutionMonitor();
    monitor.recordSchema(initialSchema);

    const driftedSchema: Record<string, any> = {
      toolName: { name: "toolName", type: "string", isRequired: true },
      // paramA is missing
    };
    const report = monitor.checkSchema(driftedSchema);

    expect(report.driftDetected).toBe(true);
    expect(report.severity).toBe("Severe");
    expect(report.details).toContain("Removed required field: paramA");
  });
});