import { describe, it, expect, vi } from "vitest";
import { ExternalStateSynchronizer } from "../src/synchronization/external-state-synchronizer";

describe("ExternalStateSynchronizer", () => {
  it("should correctly synchronize state when only user messages are present", async () => {
    const synchronizer = new ExternalStateSynchronizer();
    const userMessages = [
      { role: "user", content: "Hello" },
      { role: "user", content: "How are you?" },
    ];
    const state = await synchronizer.synchronize(userMessages);

    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[1].role).toBe("user");
    expect(state.messages[0].content).toBe("Hello");
  });

  it("should correctly synchronize state when mixed message types (user, assistant, tool) are present", async () => {
    const synchronizer = new ExternalStateSynchronizer();
    const mixedMessages = [
      { role: "user", content: "What is the capital of France?" },
      { role: "assistant", content: ["Paris"] },
      { role: "tool", tool_use_id: "tool_1", content: "The capital is Paris." },
    ];
    const state = await synchronizer.synchronize(mixedMessages);

    expect(state.messages).toHaveLength(3);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[1].role).toBe("assistant");
    expect(state.messages[2].role).toBe("tool");
    expect(state.messages[2].tool_use_id).toBe("tool_1");
  });

  it("should handle an empty message list gracefully", async () => {
    const synchronizer = new ExternalStateSynchronizer();
    const emptyMessages: any[] = [];
    const state = await synchronizer.synchronize(emptyMessages);

    expect(state.messages).toEqual([]);
    expect(state.error).toBeUndefined();
  });
});