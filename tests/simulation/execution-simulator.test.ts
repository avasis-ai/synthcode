import { describe, it, expect } from "vitest";
import { ExecutionSimulator } from "../src/simulation/execution-simulator";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/simulation/types";

describe("ExecutionSimulator", () => {
    it("should initialize correctly with initial context", () => {
        const initialContext: AgentContext = {
            memory: [new UserMessage("Hello")],
            state: { count: 0 },
            resourceUsage: { cpu: 10 },
            lastToolCallId: null,
        };
        const simulator = new ExecutionSimulator(initialContext);

        expect(simulator).toBeDefined();
        expect(simulator.context.memory).toEqual([new UserMessage("Hello")]);
        expect(simulator.context.state).toEqual({ count: 0 });
    });

    it("should update context state and memory after a tool execution step", () => {
        const initialContext: AgentContext = {
            memory: [new AssistantMessage("Thinking...")],
            state: { count: 1 },
            resourceUsage: { cpu: 20 },
            lastToolCallId: "tool-123",
        };
        const simulator = new ExecutionSimulator(initialContext);

        const step: SimulationStep = {
            toolName: "calculator",
            input: { a: 5, b: 3 },
        };

        const result: ToolResultMessage = {
            content: "The sum is 8.",
            toolCallId: "tool-123",
            toolName: "calculator",
            toolResult: { result: 8 },
        };

        simulator.executeStep(step, result);

        expect(simulator.context.state.count).toBe(1); // State should remain unchanged if not explicitly updated
        expect(simulator.context.memory).toHaveLength(2);
        expect(simulator.context.memory[1]).toBeInstanceOf(ToolResultMessage);
        expect((simulator.context.memory[1] as ToolResultMessage).toolCallId).toBe("tool-123");
    });

    it("should handle multiple steps and update resource usage", () => {
        const initialContext: AgentContext = {
            memory: [],
            state: {},
            resourceUsage: { cpu: 0, memory: 0 },
            lastToolCallId: null,
        };
        const simulator = new ExecutionSimulator(initialContext);

        // Step 1
        const step1: SimulationStep = { toolName: "search", input: { query: "test" } };
        const result1: ToolResultMessage = {
            content: "Search results found.",
            toolCallId: "tool-a",
            toolName: "search",
            toolResult: { results: ["link1"] },
        };
        simulator.executeStep(step1, result1);

        // Step 2
        const step2: SimulationStep = { toolName: "api", input: { id: 1 } };
        const result2: ToolResultMessage = {
            content: "API call successful.",
            toolCallId: "tool-b",
            toolName: "api",
            toolResult: { data: true },
        };
        simulator.executeStep(step2, result2);

        // Check resource usage accumulation (assuming executeStep increases usage)
        expect(simulator.context.resourceUsage.cpu).toBeGreaterThan(0);
        expect(simulator.context.memory).toHaveLength(2);
    });
});