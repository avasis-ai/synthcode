import { describe, it, expect } from "vitest";
import { BehavioralPatternDetector } from "./behavioral-pattern-detector";

describe("BehavioralPatternDetector", () => {
    it("should correctly detect a simple turn-taking pattern (user -> assistant)", () => {
        const detector = new BehavioralPatternDetector();
        detector.recordMessage("user", "Hello");
        detector.recordMessage("assistant", "Hi there!");

        const pattern = detector.getPattern();
        expect(pattern).toEqual(["user", "assistant"]);
    });

    it("should correctly detect a multi-turn conversation with tool use (user -> assistant -> tool -> assistant)", () => {
        const detector = new BehavioralPatternDetector();
        detector.recordMessage("user", "What is the weather?");
        detector.recordMessage("assistant", "I need to check the weather.");
        detector.recordToolUse("weather_api", { location: "London" }, true, 50);
        detector.recordMessage("assistant", "The weather is cloudy.");

        const pattern = detector.getPattern();
        expect(pattern).toEqual(["user", "assistant", "tool", "assistant"]);
    });

    it("should reset the pattern history when a new conversation starts", () => {
        const detector = new BehavioralPatternDetector();
        detector.recordMessage("user", "First conversation.");
        detector.recordMessage("assistant", "Response.");

        // Simulate a new conversation start
        detector.reset();
        detector.recordMessage("user", "Second conversation.");

        const pattern = detector.getPattern();
        expect(pattern).toEqual(["user"]);
    });
});