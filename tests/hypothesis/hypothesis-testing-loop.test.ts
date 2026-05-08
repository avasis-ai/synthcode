import { describe, it, expect } from "vitest";
import { runHypothesisTestingLoop } from "../src/hypothesis/hypothesis-testing-loop";

describe("runHypothesisTestingLoop", () => {
    it("should successfully run the loop and refine the hypothesis", async () => {
        const initialHypothesis: { id: string; statement: string; confidence: number } = {
            id: "h1",
            statement: "The user wants to find the best flight option.",
            confidence: 0.8,
        };

        const testPlan: any[] = [
            { toolName: "flight_search", input: { origin: "LAX", destination: "JFK" }, expectedOutcome: "A list of flights." },
        ];

        const refinementStrategy: (
            currentHypothesis: { id: string; statement: string; confidence: number },
            observation: string
        ) => {
            if (observation.includes("direct flight")) {
                return {
                    newHypothesis: {
                        id: "h2",
                        statement: "The user prefers direct flights from LAX to JFK.",
                        confidence: 0.9,
                    },
                    shouldContinue: false,
                };
            }
            return {
                newHypothesis: {
                    id: "h3",
                    statement: "The user needs flight information.",
                    confidence: 0.7,
                },
                shouldContinue: true,
            };
        };

        const observation = "Found several options, including a direct flight.";

        const result = await runHypothesisTestingLoop(
            initialHypothesis,
            testPlan,
            refinementStrategy,
            observation
        );

        expect(result.finalHypothesis.statement).toContain("direct flights");
        expect(result.steps.length).toBe(1);
    });

    it("should handle insufficient observation to refine the hypothesis", async () => {
        const initialHypothesis: { id: string; statement: string; confidence: number } = {
            id: "h1",
            statement: "The user is asking about travel options.",
            confidence: 0.7,
        };

        const testPlan: any[] = [
            { toolName: "weather_check", input: { location: "NYC" }, expectedOutcome: "Weather forecast." },
        ];

        const refinementStrategy: (
            currentHypothesis: { id: string; statement: string; confidence: number },
            observation: string
        ) => {
            return {
                newHypothesis: {
                    id: "h2",
                    statement: "The user needs general travel information.",
                    confidence: 0.8,
                },
                shouldContinue: true,
            };
        };

        const observation = "The weather is partly cloudy.";

        const result = await runHypothesisTestingLoop(
            initialHypothesis,
            testPlan,
            refinementStrategy,
            observation
        );

        expect(result.finalHypothesis.statement).toContain("general travel information");
        expect(result.steps.length).toBe(1);
    });

    it("should stop the loop when the refinement strategy indicates no further action", async () => {
        const initialHypothesis: { id: string; statement: string; confidence: number } = {
            id: "h1",
            statement: "The user wants to book a hotel.",
            confidence: 0.6,
        };

        const testPlan: any[] = [
            { toolName: "hotel_search", input: { city: "Paris" }, expectedOutcome: "List of hotels." },
        ];

        const refinementStrategy: (
            currentHypothesis: { id: string; statement: string; confidence: number },
            observation: string
        ) => {
            return {
                newHypothesis: {
                    id: "h2",
                    statement: "The user wants to book a hotel in Paris.",
                    confidence: 0.95,
                },
                shouldContinue: false,
            };
        };

        const observation = "Found several highly rated hotels.";

        const result = await runHypothesisTestingLoop(
            initialHypothesis,
            testPlan,
            refinementStrategy,
            observation
        );

        expect(result.finalHypothesis.statement).toContain("hotel in Paris");
        expect(result.steps.length).toBe(1);
        expect(result.shouldContinue).toBe(false);
    });
});