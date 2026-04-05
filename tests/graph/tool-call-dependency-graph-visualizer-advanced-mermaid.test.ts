import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerAdvancedMermaid } from "../src/graph/tool-call-dependency-graph-visualizer-advanced-mermaid";
import { DependencyGraph, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "../src/graph/dependency-graph-builder";

describe("ToolCallDependencyGraphVisualizerAdvancedMermaid", () => {
    it("should generate a basic mermaid graph for a simple user-tool-user interaction", () => {
        const graph = new DependencyGraph();
        const userMessage = new Message("user", "What is the weather like in London?");
        const thinkingBlock = new ThinkingBlock("Thinking about the weather...");
        const toolUseBlock = new ToolUseBlock("weather_api", { location: "London" });
        const finalMessage = new Message("assistant", "The weather in London is cloudy.");

        graph.addNode(userMessage);
        graph.addNode(thinkingBlock);
        graph.addNode(toolUseBlock);
        graph.addNode(finalMessage);

        const visualizer = new ToolCallDependencyGraphVisualizerAdvancedMermaid(graph);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("A[User Input: \"What is the weather like in London?...\"'");
        expect(mermaidCode).toContain("B[Thinking about the weather...]");
        expect(mermaidCode).toContain("C[Tool Use: weather_api]");
        expect(mermaidCode).toContain("D[Assistant: The weather in London is cloudy.]");
    });

    it("should handle a graph with multiple tool calls", () => {
        const graph = new DependencyGraph();
        const userMessage = new Message("user", "First, check the stock price for AAPL, then find the top news for tech.");
        const thinkingBlock = new ThinkingBlock("Planning multi-step query...");
        const toolUse1 = new ToolUseBlock("stock_api", { ticker: "AAPL" });
        const toolUse2 = new ToolUseBlock("news_api", { topic: "tech" });
        const finalMessage = new Message("assistant", "Here are the results for both requests.");

        graph.addNode(userMessage);
        graph.addNode(thinkingBlock);
        graph.addNode(toolUse1);
        graph.addNode(toolUse2);
        graph.addNode(finalMessage);

        const visualizer = new ToolCallDependencyGraphVisualizerAdvancedMermaid(graph);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("User Input: \"First, check the stock price for AAPL, then find the top news for tech....\"");
        expect(mermaidCode).toContain("Tool Use: stock_api");
        expect(mermaidCode).toContain("Tool Use: news_api");
    });

    it("should generate an empty graph representation if no nodes are present", () => {
        const graph = new DependencyGraph();
        const visualizer = new ToolCallDependencyGraphVisualizerAdvancedMermaid(graph);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toBe("graph TD\n"); // Expecting a minimal valid graph structure
    });
});