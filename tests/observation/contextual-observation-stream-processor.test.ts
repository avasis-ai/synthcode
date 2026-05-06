import { describe, it, expect } from "vitest";
import { ContextualObservationStreamProcessor } from "../src/observation/contextual-observation-stream-processor";
import { Observation } from "../src/observation/types";

describe("ContextualObservationStreamProcessor", () => {
  it("should process a single observation and validate data correctly", async () => {
    const processor = new ContextualObservationStreamProcessor();
    const mockObservation: Observation = {
      sourceId: "test-source",
      timestamp: Date.now(),
      rawData: { key1: "value1", key2: 123 },
      metadata: { user: "test-user" },
    };

    const result = await processor.processObservation(mockObservation);

    expect(result.success).toBe(true);
    expect(result.processedObservations).toHaveLength(1);
    expect(result.processedObservations[0].observation).toBe(mockObservation);
    expect(result.processedObservations[0].validatedData).toEqual({
      key1: "value1",
      key2: 123,
    });
  });

  it("should handle multiple observations and update context cumulatively", async () => {
    const processor = new ContextualObservationStreamProcessor();
    const initialContext: Record<string, unknown> = { count: 0, status: "initial" };

    // Simulate setting the initial context (assuming a method exists or is handled internally)
    // For testing purposes, we assume the processor can be initialized or reset with context.
    // Since the class definition is incomplete, we simulate the state change effect.
    // We will test the processing logic assuming the context is managed correctly.

    const obs1: Observation = {
      sourceId: "source1",
      timestamp: Date.now() - 100,
      rawData: { count: 1 },
      metadata: {},
    };
    const obs2: Observation = {
      sourceId: "source2",
      timestamp: Date.now(),
      rawData: { count: 1 },
      metadata: {},
    };

    // Process obs1
    let result = await processor.processObservation(obs1);
    expect(result.updatedContext).toEqual({ count: 1, status: "initial" }); // Assuming initial context is preserved/updated

    // Process obs2 (should update count)
    result = await processor.processObservation(obs2);
    expect(result.updatedContext).toEqual({ count: 2, status: "initial" }); // Assuming cumulative update
  });

  it("should detect a state transition when critical data is observed", async () => {
    const processor = new ContextualObservationStreamProcessor();
    const criticalObservation: Observation = {
      sourceId: "critical-source",
      timestamp: Date.now(),
      rawData: { error_detected: true, severity: "high" },
      metadata: {},
    };

    const result = await processor.processObservation(criticalObservation);

    expect(result.success).toBe(true);
    expect(result.stateTransitionTriggered).toBe(true);
    expect(result.updatedContext).toEqual({ error_detected: true, severity: "high" });
  });
});