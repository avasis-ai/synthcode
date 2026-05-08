import { describe, it, expect, vi } from "vitest";
import { MetricTracker, PerformanceAdjustmentSignal } from "../src/governance/contextual-performance-governor";

describe("MetricTracker", () => {
  it("should initialize and track metrics correctly", () => {
    const tracker = new MetricTracker();
    const initialMetrics: PerformanceMetrics[] = [
      { timestamp: 1678886400000, latencyMs: 100, cost: 0.01, tokens: 50 },
      { timestamp: 1678886401000, latencyMs: 250, cost: 0.05, tokens: 100 },
    ];
    // Manually setting private field for testing purposes, assuming a getter or helper exists in a real scenario
    // Since we cannot access private fields directly, we rely on methods that use the internal state.
    // For this test, we assume a method like 'addMetric' exists or we test the core logic flow.
    // Given the provided snippet, we'll test the core functionality of tracking and reporting.
    (tracker as any).addMetrics(initialMetrics);
    expect((tracker as any).getMetrics()).toHaveLength(2);
    expect((tracker as any).getMetrics()[0].latencyMs).toBe(100);
  });

  it("should calculate average metrics and detect performance issues", () => {
    const tracker = new MetricTracker();
    const metrics: PerformanceMetrics[] = [
      { timestamp: 1, latencyMs: 100, cost: 0.01, tokens: 10 },
      { timestamp: 2, latencyMs: 500, cost: 0.1, tokens: 50 }, // High latency
      { timestamp: 3, latencyMs: 200, cost: 0.02, tokens: 20 },
    ];
    (tracker as any).addMetrics(metrics);

    const signal = tracker.analyzePerformance();

    // Check if the signal indicates a warning or optimization is needed due to high latency
    expect(signal.signal).toBe("WARN");
    expect(signal.reason).toContain("latency");
  });

  it("should reset metrics and provide a clean state after analysis", () => {
    const tracker = new MetricTracker();
    const metrics: PerformanceMetrics[] = [
      { timestamp: 1, latencyMs: 100, cost: 0.01, tokens: 10 },
      { timestamp: 2, latencyMs: 200, cost: 0.02, tokens: 20 },
    ];
    (tracker as any).addMetrics(metrics);

    // Analyze performance
    tracker.analyzePerformance();

    // Check if the internal metrics array is cleared or reset
    expect((tracker as any).getMetrics()).toHaveLength(0);
  });
});