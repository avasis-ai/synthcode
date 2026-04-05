import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraphVisualizerMermaidAdvancedV106 } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v106";
import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "../src/graph/types";

describe("ToolCallDependencyGraphVisualizerMermaidAdvancedV106", () => {
    it("should generate a basic graph structure for user-assistant interaction", () => {
        const userMessage: UserMessage = { role: "user", content: "Hello world." };
        const assistantMessage: AssistantMessage = { role: "assistant", content: "Hi there!" };
        const messages: Message[] = [userMessage, assistantMessage];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV106(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("graph TD");
        expect(mermaidCode).toContain("U1[User Message]");
        expect(mermaidCode).toContain("A1[Assistant Message]");
    });

    it("should handle tool use and result messages correctly", () => {
        const userMessage: UserMessage = { role: "user", content: "What is the weather?" };
        const toolUseMessage: AssistantMessage = { role: "assistant", content: "ToolCall", toolCalls: [{ name: "get_weather", args: { location: "Tokyo" } }] };
        const toolResultMessage: ToolResultMessage = { role: "tool", content: "{\"temperature\": 25, \"unit\": \"C\"}", toolCallId: "call_1" };
        const messages: Message[] = [userMessage, toolUseMessage, toolResultMessage];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV106(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toContain("U1[User Message]");
        expect(mermaidCode).toContain("A1[ToolCall]");
        expect(mermaidCode).toContain("T1[Tool Result]");
        expect(mermaidCode).toContain("U1 --> A1");
        expect(mermaidCode).toContain("A1 --> T1");
    });

    it("should generate an empty graph if no messages are provided", () => {
        const messages: Message[] = [];

        const visualizer = new ToolCallDependencyGraphVisualizerMermaidAdvancedV106(messages);
        const mermaidCode = visualizer.generateMermaidGraph();

        expect(mermaidCode).toBe("graph TD\n");
    });
});