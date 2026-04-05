import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV6 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v6";
import { Message, ContentBlock, ToolUseBlock } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV6", () => {
    it("should correctly generate a basic mermaid graph for a simple tool call sequence", () => {
        const messages: Message[] = [
            { role: "user", content: { type: "text", content: "What is the weather?" } },
            { role: "assistant", content: { type: "tool_use", toolUse: { toolName: "get_weather", toolInputs: { location: "London" } } } },
            { role: "tool", content: { type: "tool_output", toolOutput: { toolName: "get_weather", output: "Sunny" } } },
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV6(messages, {});
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("graph TD");
        expect(mermaidGraph).toContain("A[User: What is the weather?] --> B(Tool Call: get_weather)");
        expect(mermaidGraph).toContain("B --> C[Tool Output: Sunny]");
    });

    it("should handle multiple tool calls and complex message history", () => {
        const messages: Message[] = [
            { role: "user", content: { type: "text", content: "First, check the weather, then book a flight." } },
            { role: "assistant", content: { type: "tool_use", toolUse: { toolName: "get_weather", toolInputs: { location: "Paris" } } } },
            { role: "tool", content: { type: "tool_output", toolOutput: { toolName: "get_weather", output: "Cloudy" } } },
            { role: "assistant", content: { type: "tool_use", toolUse: { toolName: "book_flight", toolInputs: { destination: "Rome" } } } },
        ];
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV6(messages, {});
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("graph TD");
        expect(mermaidGraph).toContain("A[User: First, check the weather, then book a flight.]");
        expect(mermaidGraph).toContain("B(Tool Call: get_weather)");
        expect(mermaidGraph).toContain("C(Tool Call: book_flight)");
    });

    it("should apply custom styling and grouping when advanced configuration is provided", () => {
        const messages: Message[] = [
            { role: "user", content: { type: "text", content: "Test grouping" } },
            { role: "assistant", content: { type: "tool_use", toolUse: { toolName: "tool1", toolInputs: {} } } },
        ];
        const advancedConfig = {
            defaultDirection: "LR",
            subgraphGrouping: { "user_turn": "User Actions", "assistant_turn": "AI Actions" },
            customStyles: { "User Actions": "style User Actions fill:#f9f,stroke:#333,stroke-width:2px" }
        };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV6(messages, advancedConfig);
        const mermaidGraph = visualizer.generateMermaidGraph();

        expect(mermaidGraph).toContain("graph LR");
        expect(mermaidGraph).toContain("subgraph User Actions");
        expect(mermaidGraph).toContain("style User Actions fill:#f9f,stroke:#333,stroke-width:2px");
    });
});