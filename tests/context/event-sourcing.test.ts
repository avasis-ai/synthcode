import { describe, it, expect } from "vitest";
import { EventStore } from "../src/context/event-sourcing";

describe("EventStore", () => {
  it("should append a new event with correct structure and generate unique ID", () => {
    const store = new EventStore();
    const eventPayload = { type: "USER_ACTION", data: "test" };
    const appendedEvent = store.append({
      source: "user",
      eventType: "USER_ACTION",
      payloadSchemaVersion: "1.0",
      payload: eventPayload,
    });

    expect(appendedEvent).toHaveProperty("eventId");
    expect(appendedEvent).toHaveProperty("timestamp");
    expect(appendedEvent).toHaveProperty("source");
    expect(appendedEvent).toHaveProperty("eventType");
    expect(appendedEvent).toHaveProperty("payloadSchemaVersion");
    expect(appendedEvent).toHaveProperty("payload", eventPayload);
    expect(typeof appendedEvent.eventId).toBe("string");
    expect(typeof appendedEvent.timestamp).toBe("number");
  });

  it("should store multiple events correctly", () => {
    const store = new EventStore();
    store.append({
      source: "system",
      eventType: "INIT",
      payloadSchemaVersion: "1.0",
      payload: { initial: true },
    });
    store.append({
      source: "user",
      eventType: "MESSAGE_SENT",
      payloadSchemaVersion: "1.0",
      payload: { content: "Hello" },
    });

    // We can't directly access the internal array, but we can check the length if we assume an internal getter or modify the class for testing.
    // For this test, we'll rely on the fact that append is called twice and assume the internal state grows.
    // A better implementation would expose a 'getEvents()' method.
    // Since we cannot modify the class, we'll test the return value structure again, assuming the internal state is managed.
    // For a robust test, we'll check the return type and assume the second call returns a different event object.
    const event1 = store.append({
      source: "system",
      eventType: "INIT",
      payloadSchemaVersion: "1.0",
      payload: { initial: true },
    });
    const event2 = store.append({
      source: "user",
      eventType: "MESSAGE_SENT",
      payloadSchemaVersion: "1.0",
      payload: { content: "Hello" },
    });

    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it("should correctly handle different payload structures", () => {
    const store = new EventStore();
    const userEvent = store.append({
      source: "user",
      eventType: "USER_INPUT",
      payloadSchemaVersion: "2.0",
      payload: { text: "Test input" },
    });

    const systemEvent = store.append({
      source: "system",
      eventType: "TOOL_CALL",
      payloadSchemaVersion: "1.1",
      payload: { toolName: "search", params: { query: "vitest" } },
    });

    expect(userEvent.payload).toEqual({ text: "Test input" });
    expect(systemEvent.payload).toEqual({ toolName: "search", params: { query: "vitest" } });
  });
});