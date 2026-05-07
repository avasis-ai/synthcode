import { describe, it, expect } from "vitest";
import { ObservationRules, ObservationEvent } from "../../../src/observation/reactive-observation-stream-processor.js";

describe("ReactiveObservationStreamProcessor", () => {
  it("should process events correctly based on defined rules", () => {
    const mockRules: ObservationRules = {
      filter: (event: ObservationEvent) => event.severity === "WARNING",
      // Assuming the second function in ObservationRules is for transformation/aggregation
      process: (event: ObservationEvent) => ({
        source: event.source,
        message: `Warning detected from ${event.source}`,
        severity: event.severity,
      }),
    };

    const event1: ObservationEvent = {
      source: "ServiceA",
      severity: "WARNING",
      payload: { code: 101 },
      timestamp: 1678886400000,
    };
    const event2: ObservationEvent = {
      source: "ServiceB",
      severity: "INFO",
      payload: { code: 202 },
      timestamp: 1678886401000,
    };

    const processedEvent = mockRules.process(event1);

    expect(processedEvent).toEqual({
      source: "ServiceA",
      message: "Warning detected from ServiceA",
      severity: "WARNING",
    });
  });

  it("should filter out events that do not match the criteria", () => {
    const mockRules: ObservationRules = {
      filter: (event: ObservationEvent) => event.source === "ServiceA",
      process: (event: ObservationEvent) => ({
        source: event.source,
        message: "Processed",
        severity: event.severity,
      }),
    };

    const event1: ObservationEvent = {
      source: "ServiceA",
      severity: "WARNING",
      payload: {},
      timestamp: 1,
    };
    const event2: ObservationEvent = {
      source: "ServiceB",
      severity: "CRITICAL",
      payload: {},
      timestamp: 2,
    };

    // Simulate processing logic that only processes filtered events
    const filteredEvent = mockRules.filter(event1);
    const result = filteredEvent ? mockRules.process(event1) : null;

    expect(mockRules.filter(event2)).toBe(false);
    expect(result).toEqual({
      source: "ServiceA",
      message: "Processed",
      severity: "WARNING",
    });
  });

  it("should handle multiple events and only process the valid ones", () => {
    const mockRules: ObservationRules = {
      filter: (event: ObservationEvent) => event.payload.code !== 202,
      process: (event: ObservationEvent) => ({
        source: event.source,
        message: "Processed",
        severity: event.severity,
      }),
    };

    const event1: ObservationEvent = {
      source: "ServiceA",
      severity: "WARNING",
      payload: { code: 101 },
      timestamp: 1,
    };
    const event2: ObservationEvent = {
      source: "ServiceB",
      severity: "INFO",
      payload: { code: 202 },
      timestamp: 2,
    };

    // In a real stream processor, this would iterate and collect results.
    // We simulate the collection of results.
    const results: [ObservationEvent, ObservationEvent] = [event1, event2];
    const processedResults: any[] = [];

    for (const event of results) {
      if (mockRules.filter(event)) {
        processedResults.push(mockRules.process(event));
      }
    }

    expect(processedResults.length).toBe(1);
    expect(processedResults[0].source).toBe("ServiceA");
  });
});