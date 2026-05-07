import { describe, it, expect, vi } from "vitest";
import { MessageBus } from "../src/messaging/message-bus";

describe("MessageBus", () => {
    it("should correctly emit and handle messages for different roles", async () => {
        const messageBus = new MessageBus();
        const mockHandler = vi.fn();

        messageBus.on("message", mockHandler);

        const userMessage: Message = { role: "user", content: "Hello" };
        const assistantMessage: Message = { role: "assistant", content: "Hi there" };
        const toolMessage: Message = { role: "tool", content: "Tool result" };

        await messageBus.emit("message", userMessage);
        await messageBus.emit("message", assistantMessage);
        await messageBus.emit("message", toolMessage);

        expect(mockHandler).toHaveBeenCalledTimes(3);
        expect(mockHandler).toHaveBeenCalledWith(userMessage);
        expect(mockHandler).toHaveBeenCalledWith(assistantMessage);
        expect(mockHandler).toHaveBeenCalledWith(toolMessage);
    });

    it("should handle multiple listeners for the same event type", async () => {
        const messageBus = new MessageBus();
        const mockHandler1 = vi.fn();
        const mockHandler2 = vi.fn();

        messageBus.on("message", mockHandler1);
        messageBus.on("message", mockHandler2);

        const testMessage: Message = { role: "user", content: "Test message" };

        await messageBus.emit("message", testMessage);

        expect(mockHandler1).toHaveBeenCalledTimes(1);
        expect(mockHandler2).toHaveBeenCalledTimes(1);
        expect(mockHandler1).toHaveBeenCalledWith(testMessage);
        expect(mockHandler2).toHaveBeenCalledWith(testMessage);
    });

    it("should allow removal of event listeners", async () => {
        const messageBus = new MessageBus();
        const mockHandler = vi.fn();

        const unsubscribe = messageBus.on("message", mockHandler);

        await messageBus.emit("message", { role: "user", content: "Test" });
        expect(mockHandler).toHaveBeenCalledTimes(1);

        unsubscribe();

        await messageBus.emit("message", { role: "user", content: "Test 2" });
        expect(mockHandler).toHaveBeenCalledTimes(1); // Should not be called again
    });
});