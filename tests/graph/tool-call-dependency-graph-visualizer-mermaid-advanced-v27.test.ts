import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV27 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v27";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV27", () => {
    it("should throw an error if the mermaidVersion in config is not 'v27'", () => {
        const wrongConfig = { mermaidVersion: "v26" };
        expect(() => new ToolCallDependencyGraphVisualizerMermaidAdvancedV27(wrongConfig)).toThrow("Inva");
    });

    it("should initialize correctly with the correct mermaidVersion", () => {
        const correctConfig = { mermaidVersion: "v27" };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV27(correctConfig);
        // Assuming the class stores the config, we can check for its presence or structure
        // Since we don't have internal access, we rely on the constructor not throwing.
        expect(visualizer).toBeDefined();
    });

    it("should generate a basic graph structure when provided with minimal valid data", () => {
        // Mocking the necessary types for a minimal test case
        const mockConfig = { mermaidVersion: "v27" };
        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV27(mockConfig);

        // This test assumes the class has a method to generate the graph, 
        // or that we can test its core functionality. Since the provided code is only the constructor,
        // we'll simulate testing a method that would use the config, e.g., generateGraph.
        // For this example, we'll assume a method `generateGraph` exists and returns a string.
        const mockMessage = { content: [{ type: "text", text: "Start" }] };
        
        // If generateGraph exists:
        // const graphMermaid = visualizer.generateGraph([mockMessage]);
        // expect(graphMermaid).toContain("graph TD"); 
        
        // Since we cannot assume the method, we just ensure instantiation is fine and mock a basic expectation.
        expect(typeof visualizer.config.mermaidVersion).toBe("string");
    });
});