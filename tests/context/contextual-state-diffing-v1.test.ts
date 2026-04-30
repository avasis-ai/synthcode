import { describe, it, expect } from "vitest";
import { Context, ContextDiff } from "../src/context/contextual-state-diffing-v1";

describe("ContextualStateDiffingV1", () => {
  it("should correctly diff messages when only new messages are added", () => {
    const initialContext: Context = {
      messages: [{ id: "m1", content: "Hello" }],
      tools: { search: {} },
      memory: new Map(),
      graphNodes: new Map(),
    };
    const updatedContext: Context = {
      messages: [...initialContext.messages, { id: "m2", content: "World" }],
      tools: { search: {} },
      memory: new Map(),
      graphNodes: new Map(),
    };

    const diff = Context.diff(initialContext, updatedContext);

    expect(diff.messages.added).toHaveLength(1);
    expect(diff.messages.added[0].id).toBe("m2");
    expect(diff.messages.removed).toHaveLength(0);
    expect(diff.messages.modified).toHaveLength(0);
  });

  it("should correctly diff messages when some messages are modified and some are removed", () => {
    const initialContext: Context = {
      messages: [
        { id: "m1", content: "Old content" },
        { id: "m2", content: "Unchanged" },
        { id: "m3", content: "To be removed" },
      ],
      tools: { search: {} },
      memory: new Map(),
      graphNodes: new Map(),
    };
    const updatedContext: Context = {
      messages: [
        { id: "m1", content: "New content" },
        { id: "m2", content: "Unchanged" },
        { id: "m4", content: "New message" },
      ],
      tools: { search: {} },
      memory: new Map(),
      graphNodes: new Map(),
    };

    const diff = Context.diff(initialContext, updatedContext);

    expect(diff.messages.added).toHaveLength(1);
    expect(diff.messages.added[0].id).toBe("m4");
    expect(diff.messages.removed).toHaveLength(1);
    expect(diff.messages.removed[0].id).toBe("m3");
    expect(diff.messages.modified).toHaveLength(1);
    expect(diff.messages.modified[0].old.id).toBe("m1");
    expect(diff.messages.modified[0].new.content).toBe("New content");
  });

  it("should correctly diff tools when one tool is added and one is removed", () => {
    const initialContext: Context = {
      messages: [],
      tools: { search: { name: "search" } },
      memory: new Map(),
      graphNodes: new Map(),
    };
    const updatedContext: Context = {
      messages: [],
      tools: { search: { name: "search" }, calculator: { name: "calculator" } },
      memory: new Map(),
      graphNodes: new Map(),
    };

    const diff = Context.diff(initialContext, updatedContext);

    expect(diff.tools.added).toEqual({ calculator: { name: "calculator" } });
    expect(diff.tools.removed).toEqual({});
  });
});