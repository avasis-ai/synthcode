import { describe, it, expect, vi } from "vitest";
import { StreamSyncManager } from "../../../src/synchronization/stream-sync-manager.js";

describe("StreamSyncManager", () => {
    it("should initialize correctly and handle basic message flow", async () => {
        const manager = new StreamSyncManager();
        expect(manager).toBeInstanceOf(StreamSyncManager);

        const initialMessage: Message = { role: "user", content: "Hello" };
        await manager.addMessage(initialMessage);

        const history = manager.getHistory();
        expect(history).toHaveLength(1);
        expect(history[0].role).toBe("user");
        expect(history[0].content).toBe("Hello");
    });

    it("should correctly append multiple types of messages to the history", async () => {
        const manager = new StreamSyncManager();

        // 1. User message
        const userMessage: Message = { role: "user", content: "What is the capital of France?" };
        await manager.addMessage(userMessage);

        // 2. Assistant message (simulating streaming chunks)
        const assistantMessage: Message = { role: "assistant", content: ["Hello", " "], tool_use_id: "id1" };
        await manager.addMessage(assistantMessage);

        // 3. Tool result message
        const toolResultMessage: Message = { role: "tool", tool_use_id: "id1", content: "Paris", is_error: false };
        await manager.addMessage(toolResultMessage);

        const history = manager.getHistory();
        expect(history).toHaveLength(3);
        expect(history[0].role).toBe("user");
        expect(history[1].role).toBe("assistant");
        expect(history[2].role).toBe("tool");

        // Check content structure for the tool message
        expect(history[2].content).toBe("Paris");
    });

    it("should handle updating the last message content when streaming is complete", async () => {
        const manager = new StreamSyncManager();

        // Start with a partial assistant message
        const partialMessage: Message = { role: "assistant", content: ["Loading..."], tool_use_id: "stream1" };
        await manager.addMessage(partialMessage);

        // Simulate receiving the full content
        const finalMessage: Message = { role: "assistant", content: ["The final answer."], tool_use_id: "stream1" };
        await manager.addMessage(finalMessage);

        const history = manager.getHistory();
        expect(history).toHaveLength(1);
        // The content should be updated to the final state
        expect(history[0].content).toEqual(["The final answer."]);
    });
});