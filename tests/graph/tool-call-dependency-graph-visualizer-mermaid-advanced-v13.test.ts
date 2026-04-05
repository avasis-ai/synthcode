import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV13 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v13";
import { Message, ToolUseBlock, ToolResultBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV13", () => {
    it("should generate a basic mermaid graph for a single tool call and result", () => {
        const toolUse: ToolUseBlock = {
            type: "tool_use",
            tool_use_id: "call_1",
            tool_name: "get_weather",
            tool_input: { location: "Tokyo" },
        };
        const toolResult: ToolResultBlock = {
            type: "tool_result",
            tool_use_id: "call_1",
            content: "The weather in Tokyo is sunny.",
        };
        const messages: Message[] = [
            { role: "user", content: "What's the weather in Tokyo?" },
            { role: "model", content: toolUse },
            { role: "tool", content: toolResult },
        ];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User: What's the weather in Tokyo?] --> B(Tool Call: get_weather)");
        expect(mermaidCode).toContain("B --> C[Tool Result: The weather in Tokyo is sunny.]");
    });

    it("should handle multiple sequential tool calls and results", () => {
        const toolUse1: ToolUseBlock = {
            type: "tool_use",
            tool_use_id: "call_1",
            tool_name: "get_weather",
            tool_input: { location: "Tokyo" },
        };
        const toolResult1: ToolResultBlock = {
            type: "tool_result",
            tool_use_id: "call_1",
            content: "The weather in Tokyo is sunny.",
        };
        const toolUse2: ToolUseBlock = {
            type: "tool_use",
            tool_use_id: "call_2",
            tool_name: "get_time",
            tool_input: {},
        };
        const toolResult2: ToolResultBlock = {
            type: "tool_result",
            tool_use_id: "call_2",
            content: "The current time is 10:00 AM.",
        };
        const messages: Message[] = [
            { role: "user", content: "What's the weather and time in Tokyo?" },
            { role: "model", content: toolUse1 },
            { role: "tool", content: toolResult1 },
            { role: "model", content: toolUse2 },
            { role: "tool", content: toolResult2 },
        ];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("A[User: What's the weather and time in Tokyo?] --> B(Tool Call: get_weather)");
        expect(mermaidCode).toContain("B --> C[Tool Result: The weather in Tokyo is sunny.]");
        expect(mermaidCode).toContain("C --> D(Tool Call: get_time)");
        expect(mermaidCode).toContain("D --> E[Tool Result: The current time is 10:00 AM.]");
    });

    it("should correctly represent a conversation with mixed message types", () => {
        const messages: Message[] = [
            { role: "user", content: "Hello, can you help me plan a trip?" },
            { role: "model", content: { type: "text", content: "I can certainly help with that. What are your interests?" } },
            { role: "user", content: "I like hiking and history." },
            { role: "model", content: { type: "tool_use", tool_use_id: "call_1", tool_name: "search_places", tool_input: { interest: "hiking" } } },
            { role: "tool", content: { type: "tool_result", tool_use_id: "call_1", content: "Found several hiking trails." } },
        ];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV13(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User: Hello, can you help me plan a trip?] --> B(Text: I can certainly help with that. What are your interests?)");
        expect(mermaidCode).toContain("B --> C[User: I like hiking and history.]");
        expect(mermaidCode).toContain("C --> D(Tool Call: search_places)");
        expect(mermaidCode).toContain("D --> E[Tool Result: Found several hiking trails.]");
    });
});