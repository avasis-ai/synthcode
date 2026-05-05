import { describe, it, expect } from "vitest";
import {
  ContextualStateDiffer,
  ContextualEvent,
  CausalLink,
} from "../contextual-state-diffing-v124";

describe("ContextualStateDiffer", () => {
  it("should correctly calculate the difference between two states given a sequence of events", () => {
    const initialState = {
      user: "Alice",
      settings: { theme: "dark", notifications: true },
      history: ["Hello"],
    };

    const events: ContextualEvent[] = [
      {
        timestamp: 100,
        eventType: "user_input",
        source: "user",
        payload: { text: "Hi there" },
      },
      {
        timestamp: 200,
        eventType: "assistant_response",
        source: "assistant",
        payload: { text: "Hello back!" },
      },
    ];

    const differ = new ContextualStateDiffer(initialState);
    differ.processEvents(events);

    const finalState = differ.getCurrentState();
    expect(finalState.user).toBe("Alice");
    expect(finalState.settings.theme).toBe("dark");
    expect(finalState.history).toEqual(["Hello", "Hi there", "Hello back!"]);
  });

  it("should identify causal links when a tool execution modifies a state key", () => {
    const initialState = {
      data: { count: 10, status: "pending" },
      user: "Bob",
    };

    const events: ContextualEvent[] = [
      {
        timestamp: 100,
        eventType: "user_input",
        source: "user",
        payload: { action: "increment_counter" },
      },
      {
        timestamp: 200,
        eventType: "tool_execution",
        source: "tool_api",
        payload: { result: { newCount: 15, status: "completed" } },
      },
    ];

    const differ = new ContextualStateDiffer(initialState);
    differ.processEvents(events);

    const links = differ.getCausalLinks();
    expect(links.length).toBeGreaterThanOrEqual(1);
    const linkFound = links.some(
      (link) =>
        link.targetStateKey === "data.count" &&
        link.sourceEventId.includes("tool_api")
    );
    expect(linkFound).toBe(true);
  });

  it("should maintain state integrity when processing mixed event types", () => {
    const initialState = {
      session: "active",
      metadata: { version: 1 },
    };

    const events: ContextualEvent[] = [
      {
        timestamp: 1,
        eventType: "system_update",
        source: "system",
        payload: { metadata: { version: 2 } },
      },
      {
        timestamp: 2,
        eventType: "user_input",
        source: "user",
        payload: { text: "Test" },
      },
      {
        timestamp: 3,
        eventType: "assistant_response",
        source: "assistant",
        payload: { text: "OK" },
      },
    ];

    const differ = new ContextualStateDiffer(initialState);
    differ.processEvents(events);

    const currentState = differ.getCurrentState();
    expect(currentState.metadata.version).toBe(2);
    expect(currentState.session).toBe("active");
  });
});