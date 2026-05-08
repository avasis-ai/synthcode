import { describe, it, expect } from "vitest";
import { Negotiator } from "../src/negotiation/emergent-protocol-negotiator";

describe("Negotiator", () => {
    it("should initialize correctly", () => {
        const negotiator = new Negotiator();
        expect(negotiator).toBeDefined();
    });

    it("should process a simple user message and generate an initial response", async () => {
        const negotiator = new Negotiator();
        const userMessage = { role: "user", content: "Hello, how are you?" };
        const response = await negotiator.processMessage(userMessage);

        expect(response).toBeDefined();
        expect(typeof response.content).toBe("string");
    });

    it("should handle a sequence of messages including tool use and follow-up", async () => {
        const negotiator = new Negotiator();
        const userMessage = { role: "user", content: "What is the capital of France?" };

        // Step 1: Initial processing
        let currentMessage = await negotiator.processMessage(userMessage);

        // Step 2: Simulate tool use (assuming the negotiator generates a tool call)
        // For this test, we'll assume the negotiator handles the tool call structure internally
        // and we simulate the next message being the tool result.
        const toolResultMessage = {
            role: "tool",
            tool_use_id: "tool_123",
            content: "Paris",
        };

        // Step 3: Process the tool result
        let finalResponse = await negotiator.processMessage(toolResultMessage);

        expect(finalResponse).toBeDefined();
        expect(typeof finalResponse.content).toBe("string");
        expect(finalResponse.content).toContain("Paris");
    });
});