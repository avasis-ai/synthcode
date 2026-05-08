import { describe, it, expect } from "vitest";
import { DebateManager } from "../../../src/consensus/debate-manager.js";

describe("DebateManager", () => {
  it("should initialize correctly with initial messages", async () => {
    const initialMessages = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: ["Hi there!"] },
    ];
    const manager = new DebateManager(initialMessages);
    expect(manager.getHistory()).toEqual(initialMessages);
  });

  it("should add a user message and update history", async () => {
    const manager = new DebateManager([]);
    const userMessage = { role: "user", content: "What is the topic?" };
    await manager.addMessage(userMessage);
    expect(manager.getHistory()).toContainEqual(userMessage);
    expect(manager.getHistory().length).toBe(1);
  });

  it("should add a tool result message and update history", async () => {
    const manager = new DebateManager([]);
    const toolResultMessage = {
      role: "tool",
      tool_use_id: "tool_123",
      content: "The result of the tool call.",
    };
    await manager.addMessage(toolResultMessage);
    expect(manager.getHistory()).toContainEqual(toolResultMessage);
    expect(manager.getHistory().length).toBe(1);
  });
});