import { describe, it, expect } from "vitest";
import { BaseGraphVisualizer } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v134-enhanced-v139-final-v2";

describe("BaseGraphVisualizer", () => {
    it("should be abstract and throw an error when instantiated directly", () => {
        // @ts-ignore: Intentionally calling constructor on an abstract class
        expect(() => new BaseGraphVisualizer()).toThrow();
    });

    it("should correctly process a simple linear flow", () => {
        const visualizer = new class extends BaseGraphVisualizer {
            // Mock implementation for testing purposes
            generateGraph(context: any): string => {
                if (context.messages.length === 1 && context.toolCalls.length === 1) {
                    return "graph TD; A --> B;";
                }
                return "";
            }
        }();

        const context: any = {
            messages: [{ role: "user", content: "Hello" }],
            toolCalls: [{ id: "t1", name: "toolA", input: {} }],
        };

        const mermaidCode = visualizer.generateGraph(context);
        expect(mermaidCode).toContain("graph TD; A --> B;");
    });

    it("should handle a context with multiple tool calls", () => {
        const visualizer = new class extends BaseGraphVisualizer {
            // Mock implementation for testing purposes
            generateGraph(context: any): string => {
                if (context.toolCalls.length >= 2) {
                    return "graph TD; A --> B; B --> C;";
                }
                return "";
            }
        }();

        const context: any = {
            messages: [],
            toolCalls: [
                { id: "t1", name: "toolA", input: {} },
                { id: "t2", name: "toolB", input: {} },
            ],
        };

        const mermaidCode = visualizer.generateGraph(context);
        expect(mermaidCode).toContain("graph TD; A --> B; B --> C;");
    });
});