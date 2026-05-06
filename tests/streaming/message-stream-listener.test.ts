import { describe, it, expect, vi } from "vitest";
import { MessageStreamListener } from "../src/streaming/message-stream-listener";

describe("MessageStreamListener", () => {
    it("should correctly process and emit messages from a mock stream", async () => {
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };
        const listener = new MessageStreamListener(mockStream);
        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate 'data' event
        const dataHandler = mockStream.on.mock.calls.find(call => call[0] === "data")[1];
        await dataHandler({ chunk: JSON.stringify({ role: "assistant", content: "Hello" }) });

        // Simulate 'end' event
        const endHandler = mockStream.on.mock.calls.find(call => call[0] === "end")[1];
        await endHandler();

        // Check if the listener emitted the expected message
        expect(mockEmitter.emit).toHaveBeenCalledWith("message");
        const callArgs = mockEmitter.emit.mock.calls[0][1];
        expect(callArgs).toEqual({ role: "assistant", content: "Hello" });
    });

    it("should handle multiple chunks and correctly assemble the final message", async () => {
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };
        const listener = new MessageStreamListener(mockStream);
        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate multiple data chunks
        const dataHandler = mockStream.on.mock.calls.find(call => call[0] === "data")[1];
        await dataHandler({ chunk: JSON.stringify({ role: "assistant", content: "Part 1" }) });
        await dataHandler({ chunk: JSON.stringify({ role: "assistant", content: "Part 2" }) });

        // Simulate 'end' event
        const endHandler = mockStream.on.mock.calls.find(call => call[0] === "end")[1];
        await endHandler();

        // Check if the listener emitted the final message
        expect(mockEmitter.emit).toHaveBeenCalledTimes(1);
        const callArgs = mockEmitter.emit.mock.calls[0][1];
        expect(callArgs).toEqual({ role: "assistant", content: "Part 1Part 2" });
    });

    it("should handle empty or malformed chunks gracefully", async () => {
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };
        const listener = new MessageStreamListener(mockStream);
        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate an empty chunk
        const dataHandler = mockStream.on.mock.calls.find(call => call[0] === "data")[1];
        await dataHandler({ chunk: "" });

        // Simulate a malformed chunk (not JSON)
        await dataHandler({ chunk: "{role: 'user', content: 'test'" });

        // Simulate 'end' event
        const endHandler = mockStream.on.mock.calls.find(call => call[0] === "end")[1];
        await endHandler();

        // Check that no error is thrown and the final message is empty/default
        expect(mockEmitter.emit).toHaveBeenCalledTimes(1);
        const callArgs = mockEmitter.emit.mock.calls[0][1];
        expect(callArgs).toEqual({ role: "assistant", content: "" });
    });
});