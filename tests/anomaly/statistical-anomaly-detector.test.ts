import { describe, it, expect } from "vitest"
import { StatisticalAnomalyDetector } from "../src/anomaly/statistical-anomaly-detector"

describe("StatisticalAnomalyDetector", () => {
    it("should throw an error if windowSize is not positive", () => {
        expect(() => new StatisticalAnomalyDetector(0, 1)).toThrow("Window size must be positive.")
        expect(() => new StatisticalAnomalyDetector(-1, 1)).toThrow("Window size must be positive.")
    })

    it("should throw an error if threshold is negative", () => {
        expect(() => new StatisticalAnomalyDetector(5, -1)).toThrow("Threshold must be non-negative.")
    })

    it("should detect an anomaly when the current value deviates significantly from the mean", () => {
        const detector = new StatisticalAnomalyDetector(3, 2.0)
        // Fill buffer with normal data
        detector.process(10)
        detector.process(11)
        detector.process(10)
        // Process an anomalous value (10 + 3*2.0 = 16)
        const isAnomaly = detector.process(16)
        expect(isAnomaly).toBe(true)
    })
})