import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV12 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v12";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV12", () => {
    const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV12();

    it("should generate a basic graph structure for a single tool call", () => {
        const message: Message[] = [
            {
                role: "user",
                content: "What is the weather like?",
            },
            {
                role: "assistant",
                content: "",
                toolUse: [{
                    toolName: "get_weather",
                    toolInput: {
                        location: "San Francisco",
                    },
                }],
            },
        ];
        const mermaidCode = visualizer.visualize(message);
        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User Message]");
        expect(mermaidCode).toContain("B[Tool Call: get_weather]");
    });

    it("should handle multiple sequential tool calls correctly", () => {
        const message: Message[] = [
            {
                role: "user",
                content: "First, get the weather, then check the stock price.",
            },
            {
                role: "assistant",
                content: "",
                toolUse: [{
                    toolName: "get_weather",
                    toolInput: {
                        location: "New York",
                    },
                }],
            },
            {
                role: "assistant",
                content: "",
                toolUse: [{
                    toolName: "get_stock_price",
                    toolInput: {
                        ticker: "GOOGL",
                    },
                }],
            },
        ];
        const mermaidCode = visualizer.visualize(message);
        expect(mermaidCode).toContain("get_weather");
        expect(mermaidCode).toContain("get_stock_price");
        // Check for dependency flow indication (though exact syntax depends on implementation)
        expect(mermaidCode).toMatch(/get_weather\s*-->\s*get_stock_price/s);
    });

    it("should generate an empty or minimal graph for messages without tool calls", () => {
        const message: Message[] = [
            {
                role: "user",
                content: "Hello, how are you?",
            },
            {
                role: "assistant",
                content: "I am doing well, thank you!",
            },
        ];
        const mermaidCode = visualizer.visualize(message);
        expect(mermaidCode).toContain("graph TD");
        // Should still show the basic flow but without tool nodes
        expect(mermaidCode).not.toContain("Tool Call:");
    });
});