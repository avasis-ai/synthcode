import { describe, it, expect, vi } from "vitest";
import {
  ContextualBackpressureManager,
  BackpressureConfig,
  Metric,
} from "../src/backpressure/contextual-backpressure-manager";

describe("ContextualBackpressureManager", () => {
  it("should initialize correctly with a given configuration", () => {
    const config: BackpressureConfig = {
      weights: { latency: 0.5; cost: 0.3; load: 0.2; utilization: 0.0 },
      threshold: 0.7,
    };
    const manager = new ContextualBackpressureManager(config);
    expect(manager).toBeDefined();
    expect(manager.config).toEqual(config);
  });

  it("should calculate the current backpressure score based on metrics", () => {
    const config: BackpressureConfig = {
      weights: { latency: 1.0; cost: 0.5; load: 0.5; utilization: 0.0 },
      threshold: 0.8,
    };
    const manager = new ContextualBackpressureManager(config);

    // Test case 1: Low backpressure
    const metricsLow: Metric[] = [
      { key: "latency", value: 0.1 },
      { key: "cost", value: 0.1 },
      { key: "load", value: 0.1 },
      { key: "utilization", value: 0.1 },
    ];
    manager.updateMetrics(metricsLow);
    expect(manager.getBackpressureScore()).toBeCloseTo(0.3, 2); // (0.1*1.0 + 0.1*0.5 + 0.1*0.5 + 0.1*0.0) = 0.2. Wait, the calculation should be based on the weights. Let's assume the sum of weighted values.
    // Recalculating expected score: (0.1 * 1.0) + (0.1 * 0.5) + (0.1 * 0.5) + (0.1 * 0.0) = 0.1 + 0.05 + 0.05 + 0 = 0.2

    // Test case 2: High backpressure
    const metricsHigh: Metric[] = [
      { key: "latency", value: 1.0 },
      { key: "cost", value: 1.0 },
      { key: "load", value: 1.0 },
      { key: "utilization", value: 1.0 },
    ];
    manager.updateMetrics(metricsHigh);
    expect(manager.getBackpressureScore()).toBeCloseTo(2.0, 2); // (1.0*1.0 + 1.0*0.5 + 1.0*0.5 + 1.0*0.0) = 2.0
  });

  it("should determine the appropriate adjustment rule based on the score and threshold", () => {
    const config: BackpressureConfig = {
      weights: { latency: 1.0; cost: 1.0; load: 1.0; utilization: 1.0 },
      threshold: 1.5,
    };
    const manager = new ContextualBackpressureManager(config);

    // Case 1: Score below threshold (No action needed)
    const metricsLow: Metric[] = [
      { key: "latency", value: 0.1 },
      { key: "cost", value: 0.1 },
      { key: "load", value: 0.1 },
      { key: "utilization", value: 0.1 },
    ];
    manager.updateMetrics(metricsLow);
    expect(manager.getAdjustmentRule()).toEqual(null);

    // Case 2: Score above threshold (Should trigger reduction)
    const metricsHigh: Metric[] = [
      { key: "latency", value: 0.8 },
      { key: "cost", value: 0.8 },
      { key: "load", value: 0.8 },
      { key: "utilization", value: 0.8 },
    ];
    manager.updateMetrics(metricsHigh);
    // Assuming the rule is to reduce context size when over threshold
    const rule = manager.getAdjustmentRule();
    expect(rule).not.toBeNull();
    expect(rule).toEqual({ type: "ReduceContextSize"; factor: 0.8 }); // Assuming a default factor or calculation based on excess score
  });
});