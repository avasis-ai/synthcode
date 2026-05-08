import { describe, it, expect, vi } from "vitest";
import { PredictiveSystemMonitor, TimeSeriesDataPoint, SLO } from "../src/monitoring/predictive-system-monitor";

describe("PredictiveSystemMonitor", () => {
    it("should initialize correctly with valid SLOs and stream data", () => {
        const slo: SLO = {
            metricName: "Latency",
            description: "Average API response time",
            thresholds: { max: 100, min: 10 },
            predictionWindowHours: 24,
        };
        const monitor = new PredictiveSystemMonitor([slo]);
        expect(monitor).toBeInstanceOf(PredictiveSystemMonitor);
        expect(monitor.slos.length).toBe(1);
    });

    it("should detect a predicted violation when data trends upwards", () => {
        const slo: SLO = {
            metricName: "CPU Usage",
            description: "CPU utilization percentage",
            thresholds: { max: 80, min: 10 },
            predictionWindowHours: 1,
        };
        const monitor = new PredictiveSystemMonitor([slo]);

        // Simulate data points trending towards 90 (above max 80)
        const data: TimeSeriesDataPoint[] = [
            { timestamp: Date.now() - 3600000, value: 20 },
            { timestamp: Date.now() - 1800000, value: 40 },
            { timestamp: Date.now() - 600000, value: 70 },
            { timestamp: Date.now(), value: 85 },
        ];

        // Mock the internal prediction logic to simulate a high predicted value
        vi.spyOn(monitor, 'predictViolation').mockReturnValue(95);

        const report = monitor.analyze(data);

        expect(report).toBeDefined();
        expect(report?.violationType).toBe("Exceeds Max");
        expect(report?.predictedViolationValue).toBe(95);
    });

    it("should detect no violation when data remains within SLO bounds", () => {
        const slo: SLO = {
            metricName: "Memory Usage",
            description: "RAM utilization",
            thresholds: { max: 70, min: 20 },
            predictionWindowHours: 24,
        };
        const monitor = new PredictiveSystemMonitor([slo]);

        // Simulate stable data points within bounds
        const data: TimeSeriesDataPoint[] = [
            { timestamp: Date.now() - 3600000, value: 30 },
            { timestamp: Date.now() - 1800000, value: 35 },
            { timestamp: Date.now() - 600000, value: 32 },
            { timestamp: Date.now(), value: 33 },
        ];

        // Mock the internal prediction logic to simulate a safe predicted value
        vi.spyOn(monitor, 'predictViolation').mockReturnValue(35);

        const report = monitor.analyze(data);

        expect(report).toBeDefined();
        expect(report?.violationType).toBe("None");
        expect(report?.predictedViolationValue).toBe(35);
    });
});