import { describe, it, expect } from "vitest";
import { CapabilityPerformanceMonitor } from "../../../src/capability/capability-performance-monitor.js";

describe("CapabilityPerformanceMonitor", () => {
    it("should initialize with default metrics", () => {
        const monitor = new CapabilityPerformanceMonitor();
        expect(monitor.getToolMetrics().totalObservations).toBe(0);
        expect(monitor.getToolMetrics().successfulObservations).toBe(0);
        expect(monitor.getToolMetrics().failedObservations).toBe(0);
        expect(monitor.getToolMetrics().totalLatencyMs).toBe(0);
    });

    it("should update metrics correctly upon successful observation", () => {
        const monitor = new CapabilityPerformanceMonitor();
        const observation: Observation = {
            timestamp: Date.now(),
            success: true,
            latencyMs: 150,
        };
        monitor.recordObservation(observation);

        const metrics = monitor.getToolMetrics();
        expect(metrics.totalObservations).toBe(1);
        expect(metrics.successfulObservations).toBe(1);
        expect(metrics.failedObservations).toBe(0);
        expect(metrics.totalLatencyMs).toBe(150);
        expect(metrics.observations).toHaveLength(1);
    });

    it("should update metrics correctly upon failed observation", () => {
        const monitor = new CapabilityPerformanceMonitor();
        const observation: Observation = {
            timestamp: Date.now(),
            success: false,
            latencyMs: 300,
            errorDetails: "API failed",
        };
        monitor.recordObservation(observation);

        const metrics = monitor.getToolMetrics();
        expect(metrics.totalObservations).toBe(1);
        expect(metrics.successfulObservations).toBe(0);
        expect(metrics.failedObservations).toBe(1);
        expect(metrics.totalLatencyMs).toBe(300);
        expect(metrics.observations).toHaveLength(1);
    });
});