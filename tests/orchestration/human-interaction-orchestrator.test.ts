import { describe, it, expect, vi } from "vitest";
import { HumanInteractionOrchestrator } from "../src/orchestration/human-interaction-orchestrator.js";

describe("HumanInteractionOrchestrator", () => {
  it("should initialize correctly with an event emitter", () => {
    const mockEmitter = {
      on: vi.fn(),
      emitter: vi.fn(),
    };
    const orchestrator = new HumanInteractionOrchestrator(mockEmitter);
    expect(orchestrator).toBeDefined();
  });

  it("should process a simple user message and emit an event", async () => {
    const mockEmitter = {
      on: vi.fn(),
      emitter: vi.fn(),
    };
    const orchestrator = new HumanInteractionOrchestrator(mockEmitter);
    const userMessage = { role: "user", content: "Hello world" };
    const mockEvent = { type: "message_processed", data: "processed" };
    
    // Mock the emit method to track calls
    const mockEmit = vi.spyOn(mockEmitter, "emit").mockImplementation(() => {});

    await orchestrator.processUserMessage(userMessage);

    expect(mockEmit).toHaveBeenCalledWith("message_processed", expect.objectContaining({
      message: userMessage,
    }));
  });

  it("should handle a sequence of messages including tool results", async () => {
    const mockEmitter = {
      on: vi.fn(),
      emitter: vi.fn(),
    };
    const orchestrator = new HumanInteractionOrchestrator(mockEmitter);
    
    const userMessage = { role: "user", content: "What is the weather?" };
    const toolResultMessage = { role: "tool", tool_use_id: "tool_1", content: "Sunny" };

    const mockEmit = vi.spyOn(mockEmitter, "emit").mockImplementation(() => {});

    // Simulate processing user message
    await orchestrator.processUserMessage(userMessage);

    // Simulate processing tool result
    await orchestrator.processToolResult(toolResultMessage);

    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenCalledWith("message_processed", expect.objectContaining({
      message: userMessage,
    }));
    expect(mockEmit).toHaveBeenCalledWith("tool_result_processed", expect.objectContaining({
      result: toolResultMessage,
    }));
  });
});