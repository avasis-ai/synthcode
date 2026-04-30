import { describe, it, expect } from "vitest";
import { ContextualStateCheckpointManager } from "../src/checkpointing/contextual-state-checkpointing-diff";

describe("ContextualStateCheckpointManager", () => {
  it("should calculate a correct diff when state changes in a specific field", () => {
    const mockDiffCalculator: any = {
      calculateDiff: (currentState: Record<string, any>, previousState: Record<string, any>) => {
        if (currentState.messages.length > previousState.messages.length) {
          return { messages: currentState.messages.slice(previousState.messages.length) };
        }
        return {};
      },
    };
    const manager = new ContextualStateCheckpointManager(mockDiffCalculator);

    const previousState: Record<string, any> = {
      messages: [{ id: "1", content: "Hello" }],
      isLoading: false,
    };
    const currentState: Record<string, any> = {
      messages: [{ id: "1", content: "Hello" }, { id: "2", content: "World" }],
      isLoading: false,
    };

    const diff = manager.calculateDiff(currentState, previousState);
    expect(diff).toEqual({ messages: [{ id: "2", content: "World" }] });
  });

  it("should return an empty diff when the state has not changed", () => {
    const mockDiffCalculator: any = {
      calculateDiff: (currentState: Record<string, any>, previousState: Record<string, any>) => {
        if (JSON.stringify(currentState) !== JSON.stringify(previousState)) {
          return { changed: true };
        }
        return {};
      },
    };
    const manager = new ContextualStateCheckpointManager(mockDiffCalculator);

    const state: Record<string, any> = {
      messages: [{ id: "1", content: "Hello" }],
      isLoading: false,
    };

    const diff = manager.calculateDiff(state, state);
    expect(diff).toEqual({});
  });

  it("should apply a calculated diff correctly to the previous state", () => {
    const mockDiffCalculator: any = {
      calculateDiff: () => ({ messages: [{ id: "new", content: "New message" }] }),
    };
    const mockDiffApplier: any = {
      applyDiff: (previousState: Record<string, any>, diff: Record<string, any>) => ({
        ...previousState,
        messages: [...previousState.messages, ...diff.messages],
      }),
    };
    const manager = new ContextualStateCheckpointManager(mockDiffCalculator, mockDiffApplier);

    const previousState: Record<string, any> = {
      messages: [{ id: "1", content: "Hello" }],
      isLoading: false,
    };
    const diff: Record<string, any> = { messages: [{ id: "new", content: "New message" }] };

    const newState = manager.applyDiff(previousState, diff);
    expect(newState.messages).toHaveLength(2);
    expect(newState.messages).toContainEqual({ id: "1", content: "Hello" });
    expect(newState.messages).toContainEqual({ id: "new", content: "New message" });
  });
});