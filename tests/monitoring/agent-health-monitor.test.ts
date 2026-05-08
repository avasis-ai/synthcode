import { describe, it, expect, vi } from "vitest";
import { MonitorContext, HealthMetric } from "../src/monitoring/agent-health-monitor";
import { calculateHealthScore } from "../src/monitoring/agent-health-monitor";

describe("calculateHealthScore", () => {
  it("should calculate a high score when all metrics are successful", () => {
    const context: MonitorContext = {
      runId: "run-123",
      metrics: [
        { timestamp: 1, stage: "setup", metricName: "cpu", value: 0.1, success: true },
        { timestamp: 2, stage: "test", metricName: "memory", value: 0.5, success: true },
        { timestamp: 3, stage: "teardown", metricName: "disk", value: 0.9, success: true },
      ],
      startTime: 1000,
      endTime: 2000,
    };
    const score = calculateHealthScore(context);
    expect(score).toBeGreaterThan(0.8);
  });

  it("should calculate a low score when multiple metrics fail", () => {
    const context: MonitorContext = {
      runId: "run-456",
      metrics: [
        { timestamp: 1, stage: "setup", metricName: "cpu", value: 0.1, success: true },
        { timestamp: 2, stage: "test", metricName: "memory", value: 0.5, success: false },
        { timestamp: 3, stage: "teardown", metricName: "disk", value: 0.9, success: false },
      ],
      startTime: 1000,
      endTime: 2000,
    };
    const score = calculateHealthScore(context);
    expect(score).toBeLessThan(0.5);
  });

  it("should handle an empty metric list gracefully", () => {
    const context: MonitorContext = {
      runId: "run-789",
      metrics: [],
      startTime: 1000,
      endTime: 1000,
    };
    const score = calculateHealthScore(context);
    expect(score).toBe(1.0);
  });
});