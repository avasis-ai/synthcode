import { describe, it, expect } from "vitest";
import { UsagePatternDetector } from "../src/capability/usage-pattern-detector";

describe("UsagePatternDetector", () => {
    it("should detect a simple repeating pattern", () => {
        const detector = new UsagePatternDetector(
            3,
            2,
            1,
            "A",
            "B",
            "A",
            "B",
            "A"
        );

        // Expect an event for the pattern ["A", "B"] with count 2 and frequency 0.666...
        const patternEvent = detector.waitForEvent("patternDetected");
        expect(patternEvent).toBeDefined();

        const report = patternEvent.report;
        expect(report.pattern).toEqual(["A", "B"]);
        expect(report.count).toBe(2);
        expect(report.frequency).toBeCloseTo(2 / 5, 3);
    });

    it("should not detect a pattern if the minimum frequency is too high", () => {
        const detector = new UsagePatternDetector(
            3,
            2,
            3, // minFrequency = 3
            "A",
            "B",
            "A",
            "C"
        );

        // Wait for a short duration to ensure no event is emitted
        let eventCount = 0;
        detector.on("patternDetected", () => {
            eventCount++;
        });

        // Wait for the event listener to be called (or timeout)
        const timeout = new Promise<void>(resolve => setTimeout(resolve, 50));
        return expect(timeout).resolves.then(() => {
            expect(eventCount).toBe(0);
        });
    });

    it("should detect a pattern only when the window size is sufficient", () => {
        const detector = new UsagePatternDetector(
            5, // windowSize = 5
            2,
            1,
            "A",
            "B",
            "C"
        );

        // Wait for a short duration to ensure no event is emitted
        let eventCount = 0;
        detector.on("patternDetected", () => {
            eventCount++;
        });

        const timeout = new Promise<void>(resolve => setTimeout(resolve, 50));
        return expect(timeout).resolves.then(() => {
            expect(eventCount).toBe(0);
        });
    });
});