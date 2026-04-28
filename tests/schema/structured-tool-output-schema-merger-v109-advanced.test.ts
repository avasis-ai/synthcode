import { describe, it, expect } from "vitest";
import {
    StructuredToolOutputSchemaMergerV109Advanced,
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
} from "../src/schema/structured-tool-output-schema-merger-v109-advanced";

describe("StructuredToolOutputSchemaMergerV109Advanced", () => {
    it("should correctly merge a simple user message and an assistant message", () => {
        const userMessage: UserMessage = { role: "user", content: "Hello world" };
        const assistantMessage: AssistantMessage = { role: "assistant", content: ["Some content"] };

        const merged = StructuredToolOutputSchemaMergerV109Advanced.merge(
            userMessage,
            assistantMessage
        );

        expect(merged).toEqual([
            { type: "text", text: "Hello world" },
            { type: "text", text: "Some content" },
        ]);
    });

    it("should handle a mix of text and tool use content blocks", () => {
        const userMessage: UserMessage = { role: "user", content: "What is the weather?" };
        const toolResultMessage: ToolResultMessage = {
            role: "tool",
            tool_use_id: "tool_123",
            content: "Sunny",
        };

        const merged = StructuredToolOutputSchemaMergerV109Advanced.merge(
            userMessage,
            toolResultMessage
        );

        expect(merged).toEqual([
            { type: "text", text: "What is the weather?" },
            { type: "tool_use", tool_use_id: "tool_123", content: "Sunny" },
        ]);
    });

    it("should correctly merge multiple tool result messages", () => {
        const userMessage: UserMessage = { role: "user", content: "Get data for user A and user B" };
        const toolResultMessage1: ToolResultMessage = {
            role: "tool",
            tool_use_id: "tool_a",
            content: "Data for A",
        };
        const toolResultMessage2: ToolResultMessage = {
            role: "tool",
            tool_use_id: "tool_b",
            content: "Data for B",
            is_error: true,
        };

        const merged = StructuredToolOutputSchemaMergerV109Advanced.merge(
            userMessage,
            toolResultMessage1,
            toolResultMessage2
        );

        expect(merged).toEqual([
            { type: "text", text: "Get data for user A and user B" },
            { type: "tool_use", tool_use_id: "tool_a", content: "Data for A" },
            { type: "tool_use", tool_use_id: "tool_b", content: "Data for B", is_error: true },
        ]);
    });
});