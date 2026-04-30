import { describe, it, expect } from "vitest";
import { ContextM } from "../src/context/contextual-state-diffing-v2";

describe("ContextM", () => {
  it("should correctly diff two simple state objects", () => {
    const state1 = {
      user: "Alice",
      settings: { theme: "dark", notifications: true },
      history: [
        { role: "user", content: "Hello" },
      ],
    };
    const state2 = {
      user: "Alice",
      settings: { theme: "dark", notifications: false },
      history: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    };

    const diff = ContextM.diff(state1, state2);

    expect(diff).toHaveLength(2);
    expect(diff).toEqual(
      expect.arrayContaining([
        {
          path: "settings.notifications",
          type: "updated_value",
          oldValue: true,
          newValue: false,
          message: "Notification setting changed from true to false",
        },
        {
          path: "history",
          type: "added_item",
          oldValue: undefined,
          newValue: { role: "assistant", content: "Hi there" },
          message: "History item added",
        },
      ])
    );
  });

  it("should detect added and removed fields", () => {
    const state1 = {
      user: "Bob",
      metadata: {
        version: 1,
        source: "web",
      },
    };
    const state2 = {
      user: "Bob",
      metadata: {
        version: 2,
      },
    };

    const diff = ContextM.diff(state1, state2);

    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      path: "metadata.source",
      type: "removed_field",
      oldValue: "web",
      newValue: undefined,
      message: "Field 'source' removed from metadata",
    });
  });

  it("should handle completely different states", () => {
    const state1 = {
      a: 1,
      b: "old",
    };
    const state2 = {
      x: true,
      y: [1, 2],
    };

    const diff = ContextM.diff(state1, state2);

    // Expecting at least two changes (a and b removed, x and y added)
    expect(diff).toHaveLength(4);
    expect(diff).toEqual(
      expect.arrayContaining([
        {
          path: "a",
          type: "removed_field",
          oldValue: 1,
          newValue: undefined,
          message: "Field 'a' removed",
        },
        {
          path: "b",
          type: "removed_field",
          oldValue: "old",
          newValue: undefined,
          message: "Field 'b' removed",
        },
        {
          path: "x",
          type: "added_field",
          oldValue: undefined,
          newValue: true,
          message: "Field 'x' added",
        },
        {
          path: "y",
          type: "added_field",
          oldValue: undefined,
          newValue: [1, 2],
          message: "Field 'y' added",
        },
      ])
    );
  });
});