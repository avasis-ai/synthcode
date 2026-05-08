import { describe, it, expect } from "vitest";
import { CognitiveLoadManager } from "../src/cognitive/cognitive-load-manager.js";

describe("CognitiveLoadManager", () => {
  it("should initialize correctly and manage content blocks", () => {
    const manager = new CognitiveLoadManager();
    expect(manager).toBeDefined();
    expect(manager.getBlocks()).toEqual([]);
  });

  it("should add and retrieve different types of content blocks", () => {
    const manager = new CognitiveLoadManager();
    const textBlock = { type: "text", text: "Hello world" };
    const toolUseBlock = { type: "tool_use", id: "t1", name: "search", input: { query: "test" } };
    const thinkingBlock = { type: "thinking", thinking: "Thinking process" };

    manager.addBlock(textBlock);
    manager.addBlock(toolUseBlock);
    manager.addBlock(thinkingBlock);

    const blocks = manager.getBlocks();
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual(textBlock);
    expect(blocks[1]).toEqual(toolUseBlock);
    expect(blocks[2]).toEqual(thinkingBlock);
  });

  it("should handle empty content blocks gracefully", () => {
    const manager = new CognitiveLoadManager();
    expect(manager.getBlocks()).toEqual([]);
    manager.addBlock(null as any); // Assuming the manager handles null/undefined gracefully or throws
    // Depending on implementation, we might expect an error or just ignore it.
    // Assuming the manager validates input and only adds valid blocks.
    // For this test, we assume adding invalid blocks doesn't crash and the count remains correct.
    manager.addBlock({ type: "text", text: "" });
    const blocks = manager.getBlocks();
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("text");
  });
});