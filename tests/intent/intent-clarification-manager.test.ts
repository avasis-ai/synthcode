import { describe, it, expect } from "vitest";
import { IntentClarificationManager, IntentContext, AmbiguityReport } from "../src/intent/intent-clarification-manager";

describe("IntentClarificationManager", () => {
    it("should initialize correctly with a given context", () => {
        const history: Message[] = [
            { type: "user", content: "Hello" }
        ];
        const context: IntentContext = {
            history: history,
            currentParameters: { topic: "weather" },
            requiredParameters: ["location"]
        };
        const manager = new IntentClarificationManager(context);
        // Assuming the manager has a way to check its internal state or that the constructor is sufficient
        expect(manager).toBeInstanceOf(IntentClarificationManager);
    });

    it("should generate an AmbiguityReport when parameters are missing", () => {
        const history: Message[] = [
            { type: "user", content: "I want to book a flight." }
        ];
        const context: IntentContext = {
            history: history,
            currentParameters: { destination: "Paris" },
            requiredParameters: ["departureDate", "returnDate"]
        };
        const manager = new IntentClarificationManager(context);
        const report = manager.generateAmbiguityReport();

        expect(report.missingParameters).toEqual(["departureDate", "returnDate"]);
        expect(report.conflicts).toEqual([]);
        expect(report.confidenceScore).toBeLessThan(1.0);
    });

    it("should generate an AmbiguityReport with conflicts and high confidence when context is complete", () => {
        const history: Message[] = [
            { type: "user", content: "Book a flight from NYC to LA on 2024-12-01." }
        ];
        const context: IntentContext = {
            history: history,
            currentParameters: { departureDate: "2024-12-01", origin: "NYC", destination: "LA" },
            requiredParameters: ["departureDate", "origin", "destination"]
        };
        const manager = new IntentClarificationManager(context);
        const report = manager.generateAmbiguityReport();

        expect(report.missingParameters).toEqual([]);
        expect(report.conflicts).toEqual([]);
        expect(report.confidenceScore).toBeCloseTo(1.0);
    });
});