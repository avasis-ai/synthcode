import { describe, it, expect } from "vitest";
import {
    OutputTransformer,
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
} from "../src/tool/output-transformer";

describe("OutputTransformer", () => {
    it("should transform a simple user message correctly", () => {
        const userMessage: UserMessage = { role: "user", content: "Hello world" };
        const transformed = OutputTransformer.transformUserMessage(userMessage);
        expect(transformed).toEqual([
            { type: "text", text: "Hello world" }
        ]);
    });

    it("should transform an assistant message with text content", () => {
        const assistantMessage: AssistantMessage = { role: "assistant", content: ["Some text"] };
        const transformed = OutputTransformer.transformAssistantMessage(assistantMessage);
        expect(transformed).toEqual([
            { type: "text", text: "Some text" }
        ]);
    });

    it("should transform a tool result message correctly", () => {
        const toolResultMessage: ToolResultMessage = {
            role: "tool",
            tool_use_id: "test-id",
            content: "Tool output",
        };
        const transformed = OutputTransformer.transformToolResultMessage(toolResultMessage);
        expect(transformed).toEqual([
            { type: "text", text: "Tool output" }
        ]);
    });
});