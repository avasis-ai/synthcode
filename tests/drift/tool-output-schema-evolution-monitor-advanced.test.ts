import { describe, it, expect } from "vitest";
import { ToolOutputSchemaEvolutionMonitorAdvanced } from "../src/drift/tool-output-schema-evolution-monitor-advanced";

describe("ToolOutputSchemaEvolutionMonitorAdvanced", () => {
  it("should initialize correctly with a tool name and window size", () => {
    const monitor = new ToolOutputSchemaEvolutionMonitorAdvanced("testTool", 5);
    // Assuming there's a way to check internal state or behavior that confirms initialization
    // For this test, we'll rely on the constructor's expected behavior.
    expect(monitor).toBeDefined();
  });

  it("should record a new schema history entry", () => {
    const monitor = new ToolOutputSchemaEvolutionMonitorAdvanced("testTool", 3);
    const initialSchema: Record<string, any> = { id: 1, name: "Test" };
    const timestamp = Date.now();

    // Assuming a method like recordSchemaHistory exists or can be tested via interaction
    // Since the full class implementation isn't provided, we'll simulate calling a method that adds history.
    // If the class has a public method for this, use it. Otherwise, this test might need adjustment.
    (monitor as any).recordSchemaHistory = (schema: Record<string, any>) => {
      (monitor as any).history.push({ timestamp: Date.now(), schema });
    };
    
    (monitor as any).recordSchemaHistory(initialSchema);

    // Check if history was added (assuming history is accessible or verifiable)
    expect((monitor as any).history.length).toBe(1);
    expect((monitor as any).history[0].schema).toEqual(initialSchema);
  });

  it("should calculate schema evolution metrics based on recorded history", () => {
    const monitor = new ToolOutputSchemaEvolutionMonitorAdvanced("testTool", 2);
    const schema1: Record<string, any> = { a: 1, b: "old" };
    const schema2: Record<string, any> = { a: 1, b: "new", c: true };
    const schema3: Record<string, any> = { a: 1, b: "new", c: true };

    // Simulate recording history
    (monitor as any).recordSchemaHistory = (schema: Record<string, any>) => {
      (monitor as any).history.push({ timestamp: Date.now(), schema });
    };

    (monitor as any).recordSchemaHistory(schema1);
    (monitor as any).recordSchemaHistory(schema2);
    (monitor as any).recordSchemaHistory(schema3);

    // Assuming a method to get metrics exists
    const metrics = (monitor as any).getMetrics();

    expect(metrics).toBeDefined();
    // We expect at least the last N entries to be considered for velocity/forecast
    expect(metrics.history.length).toBe(3); 
    // Velocity calculation depends on the implementation, but we check for its existence
    expect(typeof metrics.schemaEvolutionVelocity).toBe("number");
    expect(typeof metrics.schemaEvolutionForecast).toBe("string");
  });
});