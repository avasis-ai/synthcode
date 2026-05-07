import { describe, it, expect, vi } from "vitest";
import { ContextualConstraintRelaxationManager } from "../src/constraint/contextual-constraint-relaxation-manager.js";

describe("ContextualConstraintRelaxationManager", () => {
  it("should initialize correctly and manage constraints", () => {
    const manager = new ContextualConstraintRelaxationManager();
    expect(manager).toBeDefined();
  });

  it("should apply relaxation when a rule is met and emit event", () => {
    const manager = new ContextualConstraintRelaxationManager();
    const mockMetrics = { latencyMs: 500, cpuUsagePercent: 95, errorRate: 0.1 };
    const mockRule = {
      metricCheck: (metrics) => metrics.latencyMs > 400,
      constraintId: "high_latency",
      scope: "api_gateway",
      durationSeconds: 60,
    };
    const mockConstraintId = "high_latency";

    const eventSpy = vi.fn();
    manager.on("relaxationApplied", eventSpy);

    // Simulate applying the rule
    manager.applyRelaxation(mockRule, mockMetrics);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    const event = eventSpy.mock.calls[0][0];
    expect(event.constraintId).toBe(mockConstraintId);
  });

  it("should not apply relaxation if the rule is not met", () => {
    const manager = new ContextualConstraintRelaxationManager();
    const mockMetrics = { latencyMs: 100, cpuUsagePercent: 20, errorRate: 0.01 };
    const mockRule = {
      metricCheck: (metrics) => metrics.latencyMs > 400,
      constraintId: "high_latency",
      scope: "api_gateway",
      durationSeconds: 60,
    };

    const eventSpy = vi.fn();
    manager.on("relaxationApplied", eventSpy);

    // Simulate applying the rule with low metrics
    manager.applyRelaxation(mockRule, mockMetrics);

    expect(eventSpy).not.toHaveBeenCalled();
  });
});