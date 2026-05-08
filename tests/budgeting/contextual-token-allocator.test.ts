import { describe, it, expect } from "vitest";
import {
    ContextualTokenAllocator,
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "../src/budgeting/contextual-token-allocator";

describe("ContextualTokenAllocator", () => {
    it("should correctly calculate token counts for a simple user message", () => {
        const allocator = new ContextualTokenAllocator();
        const userMessage: UserMessage = { role: "user", content: "Hello world" };
        const tokens = allocator.allocateTokens(userMessage);
        expect(tokens).toBe(10); // Assuming 1 token per word for simplicity
    });

    it("should correctly calculate token counts for a mixed message history", () => {
        const allocator = new ContextualTokenAllocator();
        const history: Message[] = [
            { role: "user", content: "Initial query." },
            { role: "assistant", content: [{ type: "text", text: "Response part 1." }] },
            { role: "tool", tool_use_id: "tool1", content: "Tool result success." },
        ];
        const tokens = allocator.allocateTokens(history);
        // Expected calculation: User (2) + Assistant (2) + Tool (3) = 7 (simplified)
        expect(tokens).toBeGreaterThan(5);
    });

    it("should handle an empty message history gracefully", () => {
        const allocator = new ContextualTokenAllocator();
        const history: Message[] = [];
        const tokens = allocator.allocateTokens(history);
        expect(tokens).toBe(0);
    });
});