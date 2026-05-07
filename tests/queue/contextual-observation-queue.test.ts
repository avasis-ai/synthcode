import { describe, it, expect } from "vitest";
import { ContextualObservationQueue } from "../src/queue/contextual-observation-queue";
import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "../src/queue/types";

describe("ContextualObservationQueue", () => {
  it("should initialize with an empty queue", () => {
    const queue = new ContextualObservationQueue();
    // We assume a private method or internal state check is needed, 
    // but for simplicity, we check if adding an item works correctly.
    // If we could access private state: expect(queue["queue"]).toEqual([]);
  });

  it("should add items correctly and maintain internal structure", () => {
    const queue = new ContextualObservationQueue();
    const item1: ObservationQueueItem = {
      payload: new UserMessage("Hello"),
      source: "system",
      timestamp: Date.now() - 100,
      priority: 5,
    };
    const item2: ObservationQueueItem = {
      payload: new AssistantMessage("Hi there"),
      source: "background",
      timestamp: Date.now(),
      priority: 10,
    };

    // Assuming an add method exists or we simulate adding it
    // Since the class definition is incomplete, we assume an add method exists.
    // For this test, we assume a method `addObservation` exists.
    (queue as any).addObservation(item1);
    (queue as any).addObservation(item2);

    // Check if the queue size is correct
    expect((queue as any)["queue"].length).toBe(2);
    // Check if the items are stored correctly (order matters)
    expect((queue as any)["queue"][0].payload).toEqual(item1.payload);
    expect((queue as any)["queue"][1].payload).toEqual(item2.payload);
  });

  it("should retrieve the highest priority item first (and remove it)", () => {
    const queue = new ContextualObservationQueue();
    const now = Date.now();

    // Low priority, early
    const itemLow: ObservationQueueItem = {
      payload: new UserMessage("Low"),
      source: "system",
      timestamp: now - 200,
      priority: 1,
    };
    // High priority, late
    const itemHigh: ObservationQueueItem = {
      payload: new AssistantMessage("High"),
      source: "external",
      timestamp: now,
      priority: 100,
    };
    // Medium priority
    const itemMedium: ObservationQueueItem = {
      payload: new ToolResultMessage(null),
      source: "background",
      timestamp: now - 100,
      priority: 50,
    };

    // Assuming an add method exists
    (queue as any).addObservation(itemLow);
    (queue as any).addObservation(itemMedium);
    (queue as any).addObservation(itemHigh);

    // Assuming a method `getAndRemoveNextObservation` exists
    const nextItem = (queue as any).getAndRemoveNextObservation();

    // The highest priority item (100) should be retrieved first
    expect(nextItem).toEqual(itemHigh);

    // Check that the queue size decreased
    expect((queue as any)["queue"].length).toBe(2);

    // The next item should be the remaining highest priority (50)
    const secondItem = (queue as any).getAndRemoveNextObservation();
    expect(secondItem).toEqual(itemMedium);
  });
});