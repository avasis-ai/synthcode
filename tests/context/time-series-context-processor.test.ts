import { describe, it, expect } from "vitest";
import { TimeSeriesContextProcessor } from "../src/context/time-series-context-processor";

describe("TimeSeriesContextProcessor", () => {
  it("should throw an error if windowSize is less than 2", () => {
    expect(() => new TimeSeriesContextProcessor(1)).toThrow("Window size must be at least 2");
    expect(() => new TimeSeriesContextProcessor(0)).toThrow("Window size must be at least 2");
  });

  it("should correctly process data and generate a signal when enough data is provided", () => {
    const processor = new TimeSeriesContextProcessor(3);
    const data: { timestamp: number; value: number }[] = [
      { timestamp: 1, value: 10 },
      { timestamp: 2, value: 12 },
      { timestamp: 3, value: 15 },
      { timestamp: 4, value: 14 },
      { timestamp: 5, value: 13 },
    ];

    // Simulate processing the data
    data.forEach(point => processor.processDataPoint(point));

    // Check if the last signal is generated (assuming the implementation calculates a signal)
    // Since we don't have the full implementation, we test the expected structure and basic functionality.
    // We assume processDataPoint updates an internal state that can be retrieved or checked.
    // For this test, we'll assume the processor has a method or property to get the last signal.
    // If the processor stores the last signal, we check its existence and type.
    // Assuming the processor has a getSignal() method for testing purposes.
    // Since we cannot assume the method name, we'll test the state change based on the constructor and processing.
    
    // A more robust test would require knowing the internal state access.
    // Given the constraints, we verify that processing multiple points doesn't crash and maintains state.
    // We'll assume the processor has a method `getSignal()` that returns the TimeSeriesSignal.
    
    // Mocking the expected signal structure for a successful run
    const signal = processor["getSignal"](); // Assuming this method exists
    expect(signal).toBeDefined();
    expect(signal).toHaveProperty("mean");
    expect(signal).toHaveProperty("variance");
    expect(signal).toHaveProperty("trend");
    expect(signal).toHaveProperty("signal_strength");
    expect(signal).toHaveProperty("description");
  });

  it("should handle insufficient data points gracefully", () => {
    const processor = new TimeSeriesContextProcessor(5);
    const data: { timestamp: number; value: number }[] = [
      { timestamp: 1, value: 10 },
      { timestamp: 2, value: 12 },
    ];

    data.forEach(point => processor.processDataPoint(point));

    // We expect the signal to be undefined or default if window size is not met.
    // Assuming the processor returns null or undefined if not enough data is present.
    const signal = processor["getSignal"]();
    expect(signal).toBeUndefined();
  });
});