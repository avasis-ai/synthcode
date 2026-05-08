import { describe, it, expect } from "vitest";
import { Hypothesis } from "../src/testing/hypothesis-testing-framework.js";

describe("Hypothesis Testing Framework", () => {
    it("should correctly initialize and run a basic hypothesis test", async () => {
        const mockHypothesis = {
            name: "Simple Addition Test",
            test: async (input: number) => {
                await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async work
                return input * 2;
            },
            input: 5,
            expected: 10,
        };

        const result = await Hypothesis.run(mockHypothesis);

        expect(result.passed).toBe(true);
        expect(result.actual).toBe(10);
        expect(result.name).toBe("Simple Addition Test");
    });

    it("should handle failed hypothesis tests correctly", async () => {
        const mockHypothesis = {
            name: "Failure Test",
            test: async (input: number) => {
                return input + 1; // Incorrect logic
            },
            input: 5,
            expected: 10,
        };

        const result = await Hypothesis.run(mockHypothesis);

        expect(result.passed).toBe(false);
        expect(result.actual).toBe(6);
        expect(result.expected).toBe(10);
    });

    it("should handle asynchronous and complex inputs", async () => {
        const mockHypothesis = {
            name: "Async Data Processing",
            test: async (input: { data: string }) => {
                return input.data.toUpperCase();
            },
            input: { data: "hello world" },
            expected: "HELLO WORLD",
        };

        const result = await Hypothesis.run(mockHypothesis);

        expect(result.passed).toBe(true);
        expect(result.actual).toBe("HELLO WORLD");
    });
});