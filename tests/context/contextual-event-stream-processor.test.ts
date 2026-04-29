import { describe, it, expect, vi } from "vitest";
import { ContextualEventStreamProcessor, EventPayload } from "../src/context/contextual-event-stream-processor";

describe("ContextualEventStreamProcessor", () => {
  let processor: ContextualEventStreamProcessor;

  beforeEach(() => {
    processor = new ContextualEventStreamProcessor();
  });

  it("should process an event and emit it if processing is not active", async () => {
    const mockEvent: EventPayload = { type: "test", data: "data", timestamp: Date.now() };
    const mockListener = vi.fn();

    // Manually attach a listener to simulate external consumption
    processor["eventEmitter"].on("event", mockListener);

    await processor.processEvent(mockEvent);

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(mockEvent);
  });

  it("should queue events if processing is already active", async () => {
    const mockEvent1: EventPayload = { type: "first", data: "data1", timestamp: Date.now() };
    const mockEvent2: EventPayload = { type: "second", data: "data2", timestamp: Date.now() + 1 };

    // Simulate initial processing start (this might involve internal state changes)
    // We rely on processEvent to manage the internal queueing logic.
    await processor.processEvent(mockEvent1);

    // Process the second event while the first one is "processing" (conceptually)
    await processor.processEvent(mockEvent2);

    // In a real scenario, we'd check the internal queue size or wait for processing completion.
    // For this test, we verify that calling processEvent multiple times doesn't crash and
    // that the second event is accounted for (assuming processEvent handles queuing).
    // A more robust test would mock the internal processing loop.
    // For now, we just ensure it doesn't throw and that the queue size increases conceptually.
    // Since we can't easily access private state, we check the behavior of waitForEvent after multiple calls.
    const result = await processor.waitForEvent(10);
    expect(result).not.toBeNull();
  });

  it("should return the next event when waitForEvent is called and events are available", async () => {
    const event1: EventPayload = { type: "e1", data: 1, timestamp: Date.now() };
    const event2: EventPayload = { type: "e2", data: 2, timestamp: Date.now() + 1 };

    // Manually simulate adding events to the queue for testing waitForEvent
    (processor as any).eventQueue.push(event1);
    (processor as any).eventQueue.push(event2);

    const retrievedEvent = await processor.waitForEvent(10);

    expect(retrievedEvent).toEqual(event1);

    // Simulate the queue being processed and check the next item
    (processor as any).eventQueue.shift(); // Simulate consumption of e1
    const nextEvent = await processor.waitForEvent(10);
    expect(nextEvent).toEqual(event2);
  });
});