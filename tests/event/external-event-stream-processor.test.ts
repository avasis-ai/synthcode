import { describe, it, expect, vi } from "vitest";
import { ExternalEventStreamProcessor } from "../src/event/external-event-stream-processor";

describe("ExternalEventStreamProcessor", () => {
    it("should correctly process a stream of messages and emit events", async () => {
        const processor = new ExternalEventStreamProcessor();
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };

        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate the processor attaching listeners and processing data
        processor.processStream(mockStream, mockEmitter);

        // Check if the processor attached listeners (assuming it listens for 'data')
        expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
        expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
    });

    it("should handle partial message chunks and reconstruct the full message", async () => {
        const processor = new ExternalEventStreamProcessor();
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };

        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate receiving data in chunks
        const chunk1 = JSON.stringify({ role: "assistant", content: ["Hello", ""] });
        const chunk2 = JSON.stringify({ role: "assistant", content: ["World"] });
        const fullData = chunk1 + chunk2;

        // Manually trigger the 'data' event handler (assuming the processor uses it)
        const dataHandler = mockStream.on.mock.calls.find(call => call[0] === "data")[1];
        if (dataHandler) {
            dataHandler(fullData);
        }

        // Check if the emitter was called with the reconstructed message
        expect(mockEmitter.emit).toHaveBeenCalledWith("message");
        const emittedMessage = mockEmitter.emit.mock.calls[0][1];
        expect(emittedMessage).toEqual({ role: "assistant", content: ["Hello", "World"] });
    });

    it("should emit a final event when the stream ends", async () => {
        const processor = new ExternalEventStreamProcessor();
        const mockStream = {
            on: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
        };

        const mockEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        };

        // Simulate processing data first
        const dataHandler = mockStream.on.mock.calls.find(call => call[0] === "data")[1];
        if (dataHandler) {
            dataHandler(JSON.stringify({ role: "assistant", content: ["Test"] }));
        }

        // Simulate the 'end' event
        const endHandler = mockStream.on.mock.calls.find(call => call[0] === "end")[1];
        if (endHandler) {
            endHandler();
        }

        // Check if the 'stream-end' event was emitted
        expect(mockEmitter.emit).toHaveBeenCalledWith("stream-end");
    });
});