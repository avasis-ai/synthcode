import { describe, it, expect } from "vitest";
import {
  ContextualStateDiffingV106,
  Message,
  ContentBlock,
} from "../src/context/contextual-state-diffing-v106";

describe("ContextualStateDiffingV106", () => {
  it("should correctly diff simple text content changes", () => {
    const state1: Message[] = [
      { role: "user", content: "Hello world" } as Message,
    ];
    const state2: Message[] = [
      { role: "user", content: "Hello, world!" } as Message,
    ];
    const diff = ContextualStateDiffingV106(state1, state2);
    expect(diff).toEqual([
      { type: "message_update", path: [0], diff: { content: "Hello, world!" } },
    ]);
  });

  it("should detect the addition of a new message block", () => {
    const state1: Message[] = [
      { role: "user", content: "Initial message" } as Message,
    ];
    const state2: Message[] = [
      { role: "user", content: "Initial message" } as Message,
      { role: "assistant", content: "Response" } as Message,
    ];
    const diff = ContextualStateDiffingV106(state1, state2);
    expect(diff).toEqual([
      { type: "message_append", path: [1] },
    ]);
  });

  it("should handle complex structural changes involving tool use", () => {
    const state1: Message[] = [
      { role: "user", content: "Use tool A" } as Message,
      { role: "assistant", content: "Tool call A" } as Message,
    ];
    const state2: Message[] = [
      { role: "user", content: "Use tool A" } as Message,
      { role: "assistant", content: "Tool call A" } as Message,
      { role: "tool_result", content: "Result A" } as Message,
    ];
    const diff = ContextualStateDiffingV106(state1, state2);
    expect(diff).toEqual([
      { type: "message_append", path: [2] },
    ]);
  });
});