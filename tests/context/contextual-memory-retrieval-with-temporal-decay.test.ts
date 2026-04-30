import { describe, it, expect } from "vitest";
import {
  MemoryContext,
  MemoryContextOptions,
} from "../contextual-memory-retrieval-with-temporal-decay";

describe("MemoryContext", () => {
  it("should correctly store and retrieve messages with decay", async () => {
    const memoryContext = new MemoryContext({
      initialMessages: [
        { role: "user", content: "First message" },
        { role: "assistant", content: [{ type: "text", content: "Response 1" }] },
      ],
      decayRate: 0.1,
      decayInterval: 100,
    });

    // Simulate time passing and decay
    await memoryContext.simulateTimePassage(200);

    // Add a new message
    await memoryContext.addMessage({ role: "user", content: "Second message" });

    // Check if the memory size reflects the addition and decay
    const messages = memoryContext.getMessages();
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages).toContainEqual({ role: "user", content: "Second message" });
  });

  it("should handle initial empty memory state", async () => {
    const memoryContext = new MemoryContext({
      initialMessages: [],
      decayRate: 0.05,
      decayInterval: 50,
    });

    let messages = memoryContext.getMessages();
    expect(messages).toEqual([]);

    // Simulate time passage without adding messages
    await memoryContext.simulateTimePassage(100);
    messages = memoryContext.getMessages();
    expect(messages).toEqual([]);
  });

  it("should decay older messages based on elapsed time", async () => {
    const memoryContext = new MemoryContext({
      initialMessages: [
        { role: "user", content: "Old message" },
      ],
      decayRate: 0.2,
      decayInterval: 100,
    });

    // Simulate significant time passage
    await memoryContext.simulateTimePassage(500);

    // Check if the message has decayed or been removed (depending on implementation details)
    const messages = memoryContext.getMessages();
    // Assuming decay removes messages entirely if decay factor is high enough over time
    expect(messages.length).toBe(0);
  });
});