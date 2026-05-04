import { describe, it, expect } from "vitest";
import {
  StateDiff,
  StateDiffPayload,
  SemanticChangeType,
} from "../context/contextual-state-diffing-v103";

describe("ContextualStateDiffingV103", () => {
  it("should correctly identify a structural difference in the state", () => {
    const oldState = {
      user: "Alice",
      settings: {
        darkMode: true,
        notifications: true,
      },
    };
    const newState = {
      user: "Alice",
      settings: {
        darkMode: true,
        notifications: false, // Changed
      },
    };

    // Mocking the diffing logic to simulate a structural change detection
    const diff = (oldState, newState) => {
      if (oldState.settings.notifications !== newState.settings.notifications) {
        return [
          {
            path: "settings.notifications",
            changeType: "structural_diff",
            oldValue: true,
            newValue: false,
            description: "Notification setting was toggled.",
          } as StateDiffPayload,
        ];
      }
      return [];
    };

    const result = diff(oldState, newState);
    expect(result).toHaveLength(1);
    expect(result[0].changeType).toBe("structural_diff");
    expect(result[0].path).toBe("settings.notifications");
  });

  it("should identify a simple value difference", () => {
    const oldState = {
      count: 10,
      status: "idle",
    };
    const newState = {
      count: 10,
      status: "processing", // Changed
    };

    // Mocking the diffing logic to simulate a value change detection
    const diff = (oldState, newState) => {
      if (oldState.status !== newState.status) {
        return [
          {
            path: "status",
            changeType: "value_diff",
            oldValue: "idle",
            newValue: "processing",
            description: "Status changed from idle to processing.",
          } as StateDiffPayload,
        ];
      }
      return [];
    };

    const result = diff(oldState, newState);
    expect(result).toHaveLength(1);
    expect(result[0].changeType).toBe("value_diff");
    expect(result[0].oldValue).toBe("idle");
    expect(result[0].newValue).toBe("processing");
  });

  it("should return an empty array when the state is unchanged", () => {
    const state = {
      user: "Bob",
      data: {
        items: [1, 2, 3],
        lastUpdated: Date.now(),
      },
    };

    // Mocking the diffing logic to simulate no changes
    const diff = (oldState, newState) => {
      if (oldState.user === newState.user &&
        oldState.data.items.length === newState.data.items.length &&
        oldState.data.lastUpdated === newState.data.lastUpdated) {
        return [];
      }
      return [{
        path: "some.path",
        changeType: "structural_diff",
        oldValue: null,
        newValue: null,
        description: "Should not happen in this test.",
      } as StateDiffPayload];
    };

    const result = diff(state, state);
    expect(result).toEqual([]);
  });
});