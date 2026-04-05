import { describe, it, expect } from "vitest";
import { DebuggerContext } from "../src/graph/tool-call-dependency-graph-debugger";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/graph/types";

describe("DebuggerContext", () => {
    it("should initialize with provided history, nodes, and edges", () => {
        const initialHistory: Message[] = [
            new UserMessage("Hello"),
            new AssistantMessage("Hi there!")
        ];
        const initialNodes = new Map<string, any>();
        const initialEdges = new Map<string, any>();

        const context = new DebuggerContext(initialHistory, initialNodes, initialEdges);

        expect(context.getHistory()).toEqual(initialHistory);
        expect(context.getGraphNodes()).toBe(initialNodes);
        expect(context.getGraphEdges()).toBe(initialEdges);
    });

    it("should add a new message to the history and update the graph", () => {
        const initialHistory: Message[] = [];
        const initialNodes = new Map<string, any>();
        const initialEdges = new Map<string, any>();

        const context = new DebuggerContext(initialHistory, initialNodes, initialEdges);
        const newMessage = new AssistantMessage("Some response");

        context.addMessage(newMessage);

        expect(context.getHistory()).toHaveLength(1);
        expect(context.getHistory()[0]).toEqual(newMessage);
        // Assuming addMessage updates the graph structure based on the message type
        expect(context.getGraphNodes().size).toBeGreaterThan(0);
    });

    it("should correctly process a tool use message and update the graph", () => {
        const initialHistory: Message[] = [new UserMessage("What is the weather?")];
        const initialNodes = new Map<string, any>();
        const initialEdges = new Map<string, any>();

        const context = new DebuggerContext(initialHistory, initialNodes, initialEdges);
        const toolUseMessage = new AssistantMessage(null, [
            new ToolUseBlock("get_weather", { location: "London" })
        ]);

        context.addMessage(toolUseMessage);

        // Check if the tool use node/edge was added
        expect(context.getGraphNodes().has("tool_use_node_id")).toBe(true);
    });
});