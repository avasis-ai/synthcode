import { describe, it, expect } from "vitest";
import { EventBus } from "../src/event-bus";

describe("EventBus", () => {
  it("should allow multiple handlers to be subscribed to the same event", async () => {
    const eventBus = EventBus.getInstance();
    const eventType = "testEvent";
    const handler1 = vi.fn(async (data: string) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return data;
    });
    const handler2 = vi.fn(async (data: string) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return data;
    });

    eventBus.subscribe(eventType, handler1);
    eventBus.subscribe(eventType, handler2);

    await eventBus.emit(eventType, "testData");

    expect(handler1).toHaveBeenCalledWith("testData");
    expect(handler2).toHaveBeenCalledWith("testData");
  });

  it("should execute all subscribed handlers when emit is called", async () => {
    const eventBus = EventBus.getInstance();
    const eventType = "dataUpdate";
    const handler1 = vi.fn(async (data: number) => {
      return data * 2;
    });
    const handler2 = vi.fn(async (data: number) => {
      return data + 1;
    });

    eventBus.subscribe(eventType, handler1);
    eventBus.subscribe(eventType, handler2);

    const results = await eventBus.emit(eventType, 5);

    expect(handler1).toHaveBeenCalledWith(5);
    expect(handler2).toHaveBeenCalledWith(5);
    // Assuming emit returns an array of results or handles them correctly
    expect(results).toHaveLength(2);
  });

  it("should unsubscribe a handler and stop calling it", async () => {
    const eventBus = EventBus.getInstance();
    const eventType = "cleanupEvent";
    const handler1 = vi.fn(async () => {});
    const handler2 = vi.fn(async () => {});

    const unsubscribe1 = eventBus.subscribe(eventType, handler1);
    eventBus.subscribe(eventType, handler2);

    unsubscribe1();

    await eventBus.emit(eventType, null as any);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});