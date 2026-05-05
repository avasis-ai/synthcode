import { describe, it, expect } from "vitest";
import { CausalStateDiff } from "../context/contextual-state-diffing-v133";

describe("CausalStateDiff", () => {
  it("should correctly diff a simple state change", () => {
    const initialState: Record<string, any> = {
      elementA: { id: "a", value: 1 },
      elementB: { id: "b", value: "initial" },
    };
    const finalState: Record<string, any> = {
      elementA: { id: "a", value: 2 },
      elementB: { id: "b", value: "updated" },
      elementC: { id: "c", value: true },
    };

    const diff: CausalStateDiff = {
      diffedElements: {
        elementA: { changed: true, oldValue: initialState.elementA, newValue: finalState.elementA },
        elementB: { changed: true, oldValue: initialState.elementB, newValue: finalState.elementB },
        elementC: { changed: true, added: finalState.elementC },
      },
    };

    expect(diff.diffedElements.elementA).toEqual({ changed: true, oldValue: initialState.elementA, newValue: finalState.elementA });
    expect(diff.diffedElements.elementC).toEqual({ changed: true, added: finalState.elementC });
  });

  it("should report no changes if the state is identical", () => {
    const state: Record<string, any> = {
      userMessage: { id: "u1", content: "Hello" },
      toolResult: { id: "t1", result: "OK" },
    };

    const diff: CausalStateDiff = {
      diffedElements: {
        userMessage: { changed: false },
        toolResult: { changed: false },
      },
    };

    expect(diff.diffedElements.userMessage).toEqual({ changed: false });
    expect(Object.keys(diff.diffedElements).length).toBe(2);
  });

  it("should handle removals correctly", () => {
    const initialState: Record<string, any> = {
      elementX: { id: "x", data: "keep" },
      elementY: { id: "y", data: "remove" },
    };
    const finalState: Record<string, any> = {
      elementX: { id: "x", data: "keep" },
    };

    const diff: CausalStateDiff = {
      diffedElements: {
        elementX: { changed: false },
        elementY: { removed: initialState.elementY },
      },
    };

    expect(diff.diffedElements.elementY).toEqual({ removed: initialState.elementY });
    expect(Object.keys(diff.diffedElements).length).toBe(2);
  });
});