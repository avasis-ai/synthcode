import { describe, it, expect } from "vitest";
import { runPromptOptimizationLoop } from "../src/optimization/prompt-optimization-loop";

describe("runPromptOptimizationLoop", () => {
    it("should run the optimization loop and return the final optimized prompt", async () => {
        const initialPrompt = "Write a short story about a robot.";
        const mockFailureReport = {
            type: "ambiguity",
            details: "The robot's purpose is unclear.",
            severity: "medium",
            failed_output: "A story about a robot.",
        };
        const optimizedPrompt = "Write a short story about a robot that is a sanitation worker.";

        // Mock the internal logic that determines the next step
        // In a real scenario, this would involve calling an LLM or complex logic.
        // We simulate the successful completion of the loop.
        const result = await runPromptOptimizationLoop(
            initialPrompt,
            [mockFailureReport]
        );

        expect(result).toBe(optimizedPrompt);
    });

    it("should handle a scenario where no optimization is needed", async () => {
        const initialPrompt = "List three benefits of exercise.";
        const mockFailureReport = null;
        const expectedPrompt = "List three benefits of exercise.";

        const result = await runPromptOptimizationLoop(
            initialPrompt,
            [mockFailureReport]
        );

        expect(result).toBe(expectedPrompt);
    });

    it("should iteratively refine the prompt based on multiple failure reports", async () => {
        const initialPrompt = "Describe a futuristic city.";
        const failureReports = [
            {
                type: "constraint_violation",
                details: "Must include flying vehicles.",
                severity: "high",
                failed_output: "A description of a city.",
            },
            {
                type: "ambiguity",
                details: "Specify the time period (e.g., 23rd century).",
                severity: "medium",
                failed_output: "A description of a city.",
            },
        ];
        const finalOptimizedPrompt = "Describe a futuristic city from the 23rd century, ensuring it includes flying vehicles.";

        const result = await runPromptOptimizationLoop(
            initialPrompt,
            failureReports
        );

        expect(result).toBe(finalOptimizedPrompt);
    });
});