import { describe, it, expect, vi } from "vitest";
import { ProcessAnomalyDetector, HistoryStore } from "../src/monitoring/process-anomaly-detector";

describe("ProcessAnomalyDetector", () => {
    let mockHistoryStore: HistoryStore;
    let detector: ProcessAnomalyDetector;

    beforeEach(() => {
        // Mock the HistoryStore implementation
        mockHistoryStore = {
            getHistoricalStepCounts: vi.fn(),
            getHistoricalStepDurations: vi.fn(),
        };
        detector = new ProcessAnomalyDetector(mockHistoryStore);
    });

    it("should detect an anomaly when current step count significantly deviates from history", async () => {
        // Arrange: Set up history (e.g., average 5 steps)
        mockHistoryStore.getHistoricalStepCounts.mockReturnValue([5, 5, 4, 6, 5]);
        // Arrange: Simulate a current run with a high step count (e.g., 15)
        const currentStepCount = 15;

        // Act
        const report = await detector.detectAnomaly(currentStepCount, 100); // 100ms duration

        // Assert
        expect(report.isAnomaly).toBe(true);
        expect(report.details.stepCountDeviation).toBeGreaterThan(2);
        expect(report.message).toContain("step count deviation");
    });

    it("should detect an anomaly when current step duration significantly deviates from history", async () => {
        // Arrange: Set up history (e.g., average 50ms duration)
        mockHistoryStore.getHistoricalStepDurations.mockReturnValue([45, 55, 50, 60, 52]);
        // Arrange: Simulate a current run with a high duration (e.g., 300ms)
        const currentDuration = 300;

        // Act
        const report = await detector.detectAnomaly(5, currentDuration); // 5 steps count

        // Assert
        expect(report.isAnomaly).toBe(true);
        expect(report.details.stepDurationDeviation).toBeGreaterThan(100);
        expect(report.message).toContain("step duration deviation");
    });

    it("should report no anomaly when current metrics are within historical bounds", async () => {
        // Arrange: Set up history (e.g., average 5 steps, 50ms duration)
        mockHistoryStore.getHistoricalStepCounts.mockReturnValue([5, 5, 4, 6, 5]);
        mockHistoryStore.getHistoricalStepDurations.mockReturnValue([45, 55, 50, 60, 52]);
        // Arrange: Simulate a current run with normal metrics
        const currentStepCount = 5;
        const currentDuration = 55;

        // Act
        const report = await detector.detectAnomaly(currentStepCount, currentDuration);

        // Assert
        expect(report.isAnomaly).toBe(false);
        expect(report.details.stepCountDeviation).toBeLessThan(1);
        expect(report.details.stepDurationDeviation).toBeLessThan(1);
    });
});