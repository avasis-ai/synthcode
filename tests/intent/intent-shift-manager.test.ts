import { describe, it, expect } from "vitest";
import { IntentShiftManager } from "../src/intent/intent-shift-manager";

describe("IntentShiftManager", () => {
    it("should detect a shift when the score exceeds the threshold", () => {
        // Arrange
        const manager = new IntentShiftManager(0.5, 3);
        const history: Array<Message> = [
            { role: "user", content: "Hello, what is the weather like?", timestamp: Date.now() - 10000 },
            { role: "assistant", content: "It looks like rain.", timestamp: Date.now() - 5000 },
            { role: "user", content: "Can you book me a flight to Paris?", timestamp: Date.now() }
        ];

        // Act
        const report = manager.analyze(history);

        // Assert
        expect(report.isShiftDetected).toBe(true);
        expect(report.shiftScore).toBeGreaterThan(0.5);
        expect(report.newActiveIntent).toBe("Travel");
        expect(report.contextResetRequired).toBe(true);
    });

    it("should not detect a shift when the score is below the threshold", () => {
        // Arrange
        const manager = new IntentShiftManager(0.5, 3);
        const history: Array<Message> = [
            { role: "user", content: "What is the capital of France?", timestamp: Date.now() - 10000 },
            { role: "assistant", content: "It is Paris.", timestamp: Date.now() - 5000 },
            { role: "user", content: "Tell me more about French history.", timestamp: Date.now() }
        ];

        // Act
        const report = manager.analyze(history);

        // Assert
        expect(report.isShiftDetected).toBe(false);
        expect(report.shiftScore).toBeLessThan(0.5);
        expect(report.newActiveIntent).toBeNull();
        expect(report.contextResetRequired).toBe(false);
    });

    it("should handle empty or insufficient history gracefully", () => {
        // Arrange
        const manager = new IntentShiftManager(0.5, 3);
        const emptyHistory: Array<Message> = [];
        const insufficientHistory: Array<Message> = [
            { role: "user", content: "Hi", timestamp: Date.now() }
        ];

        // Act
        const reportEmpty = manager.analyze(emptyHistory);
        const reportInsufficient = manager.analyze(insufficientHistory);

        // Assert
        expect(reportEmpty.isShiftDetected).toBe(false);
        expect(reportEmpty.shiftScore).toBe(0);
        expect(reportEmpty.newActiveIntent).toBeNull();

        expect(reportInsufficient.isShiftDetected).toBe(false);
        expect(reportInsufficient.shiftScore).toBe(0);
        expect(reportInsufficient.newActiveIntent).toBeNull();
    });
});