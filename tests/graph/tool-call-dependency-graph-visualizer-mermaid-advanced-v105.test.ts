import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v105";

describe("DependencyGraph", () => {
    it("should correctly generate a basic graph structure from sample data", () => {
        const graph: DependencyGraph = {
            messages: [
                { id: "msg1", role: "user", content: { type: "text", text: "Hello" } },
                { id: "msg2", role: "assistant", content: { type: "tool_use", toolUse: { toolName: "search", arguments: {} } } },
                { id: "msg3", role: "assistant", content: { type: "text", text: "Search results received." } },
            ],
            dependencies: [
                { sourceId: "msg1", targetId: "msg2", type: "call" },
                { sourceId: "msg2", targetId: "msg3", type: "response" },
            ],
        };

        const visualizer = new DependencyGraph(graph);
        const mermaidCode = visualizer.generateMermaidCode();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("msg1 --> msg2");
        expect(mermaidCode).toContain("msg2 --> msg3");
    });

    it("should handle complex dependencies including thinking and error states", () => {
        const graph: DependencyGraph = {
            messages: [
                { id: "msgA", role: "user", content: { type: "text", text: "Complex query" } },
                { id: "msgB", role: "assistant", content: { type: "thinking", thinking: { thought: "Thinking step 1" } } },
                { id: "msgC", role: "assistant", content: { type: "tool_use", toolUse: { toolName: "api", arguments: {} } } },
                { id: "msgD", role: "assistant", content: { type: "text", text: "Success" } },
            ],
            dependencies: [
                { sourceId: "msgA", targetId: "msgB", type: "dependency" },
                { sourceId: "msgB", targetId: "msgC", type: "call" },
                { sourceId: "msgC", targetId: "msgD", type: "response" },
            ],
        };

        const visualizer = new DependencyGraph(graph);
        const mermaidCode = visualizer.generateMermaidCode();

        expect(mermaidCode).toContain("msgA --> msgB");
        expect(mermaidCode).toContain("msgB --> msgC");
        expect(mermaidCode).toContain("msgC --> msgD");
    });

    it("should apply custom styling options correctly", () => {
        const graph: DependencyGraph = {
            messages: [
                { id: "msg1", role: "user", content: { type: "text", text: "Start" } },
                { id: "msg2", role: "assistant", content: { type: "tool_use", toolUse: { toolName: "search", arguments: {} } } },
            ],
            dependencies: [
                { sourceId: "msg1", targetId: "msg2", type: "call" },
            ],
        };

        const options = {
            defaultNodeStyle: "style fill:#eee,stroke:#333",
            toolUseNodeStyle: "style fill:#ccf,stroke:#666",
            thinkingNodeStyle: "style fill:#ffc,stroke:#999",
            errorEdgeStyle: "stroke:red,stroke-width:2px",
            successEdgeStyle: "stroke:green,stroke-width:2px",
        };

        const visualizer = new DependencyGraph(graph, options);
        const mermaidCode = visualizer.generateMermaidCode();

        expect(mermaidCode).toContain("style msg2 fill:#ccf,stroke:#666");
        expect(mermaidCode).toContain("linkStyle 1 stroke:green,stroke-width:2px");
    });
});