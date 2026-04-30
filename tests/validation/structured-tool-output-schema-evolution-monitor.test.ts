import { describe, it, expect } from "vitest";
import { StructuredToolOutputSchemaEvolutionMonitor } from "../src/validation/structured-tool-output-schema-evolution-monitor";

describe("StructuredToolOutputSchemaEvolutionMonitor", () => {
  it("should initialize with correct baseline and last known schemas", () => {
    const baseline: any = { toolA: { name: "string", required: true } };
    const lastKnown: any = { toolA: { name: "string", required: true } };
    const monitor = new StructuredToolOutputSchemaEvolutionMonitor(baseline, lastKnown);

    expect(monitor.getState().baselineSchema).toEqual(baseline);
    expect(monitor.getState().lastKnownSchema).toEqual(lastKnown);
    expect(monitor.getState().driftHistory).toEqual([]);
  });

  it("should detect a missing field when comparing current to baseline", () => {
    const baseline: any = { toolA: { name: "string", required: true }, toolB: { name: "number", required: false } };
    const lastKnown: any = { toolA: { name: "string", required: true }, toolB: { name: "number", required: false } };
    const monitor = new StructuredToolOutputSchemaEvolutionMonitor(baseline, lastKnown);

    // Simulate a current schema missing 'toolB'
    const currentSchema: any = { toolA: { name: "string", required: true } };
    monitor.updateSchema(currentSchema);

    const state = monitor.getState();
    expect(state.driftHistory).toHaveLength(1);
    expect(state.driftHistory[0].field).toBe("toolB");
    expect(state.driftHistory[0].issue).toBe("missing");
  });

  it("should detect an extra field when comparing current to baseline", () => {
    const baseline: any = { toolA: { name: "string", required: true } };
    const lastKnown: any = { toolA: { name: "string", required: true } };
    const monitor = new StructuredToolOutputSchemaEvolutionMonitor(baseline, lastKnown);

    // Simulate a current schema with an extra field 'toolC'
    const currentSchema: any = { toolA: { name: "string", required: true }, toolC: { name: "boolean", required: false } };
    monitor.updateSchema(currentSchema);

    const state = monitor.getState();
    expect(state.driftHistory).toHaveLength(1);
    expect(state.driftHistory[0].field).toBe("toolC");
    expect(state.driftHistory[0].issue).toBe("extra");
  });
});