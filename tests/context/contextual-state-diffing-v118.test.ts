import { describe, it, expect } from "vitest";
import { ContextualStateDiffer } from "../src/context/contextual-state-diffing-v118";

describe("ContextualStateDiffer", () => {
  it("should return an empty diff report when states are identical", () => {
    const differ = new ContextualStateDiffer();
    const oldState = {
      messages: [
        { type: "user", content: "Hello" },
        { type: "assistant", content: "Hi there" },
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
      },
    };
    const newState = {
      messages: [
        { type: "user", content: "Hello" },
        { type: "assistant", content: "Hi there" },
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
      },
    };

    const diff = differ.diff(oldState, newState);
    expect(diff).toEqual([]);
  });

  it("should detect a simple modification in a nested property", () => {
    const differ = new ContextualStateDiffer();
    const oldState = {
      messages: [
        { type: "user", content: "Initial message" },
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
        session: "A",
      },
    };
    const newState = {
      messages: [
        { type: "user", content: "Initial message" },
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
        session: "B", // Changed value
      },
    };

    const diff = differ.diff(oldState, newState);
    expect(diff.length).toBe(1);
    expect(diff[0].path).toBe("metadata.session");
    expect(diff[0].changeType).toBe("modified");
    expect(diff[0].oldValue).toBe("A");
    expect(diff[0].newValue).toBe("B");
  });

  it("should detect an added element in an array", () => {
    const differ = new ContextualStateDiffer();
    const oldState = {
      messages: [
        { type: "user", content: "First message" },
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
      },
    };
    const newState = {
      messages: [
        { type: "user", content: "First message" },
        { type: "assistant", content: "Second message added" }, // Added message
      ],
      metadata: {
        timestamp: 1678886400,
        userId: "user123",
      },
    };

    const diff = differ.diff(oldState, newState);
    expect(diff.length).toBeGreaterThan(0);
    // We expect at least one diff related to the array change, though the exact path might depend on implementation details (e.g., index 1)
    const addedDiff = diff.find(d => d.path.includes("messages") && d.changeType === "added");
    expect(addedDiff).toBeDefined();
  });
});