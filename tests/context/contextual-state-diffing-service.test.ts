import { describe, it, expect } from "vitest";
import { ContextualStateDiffingService } from "../src/context/contextual-state-diffing-service";

describe("ContextualStateDiffingService", () => {
  it("should correctly detect additions when comparing two contexts", () => {
    const service = new ContextualStateDiffingService();
    const oldContext = {
      messages: [{ type: "user", content: "Hello" }],
      metadata: { count: 1 },
    };
    const newContext = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi there" }],
      metadata: { count: 1, lastUpdated: Date.now() },
    };

    const diff = service.compare(oldContext, newContext, 'structural');

    expect(diff).toHaveLength(2);
    expect(diff).toEqual(expect.arrayContaining([
      expect.objectContaining({
        operation: "added",
        path: "messages[1]",
        oldValue: null,
        newValue: { type: "assistant", content: "Hi there" },
      }),
      expect.objectContaining({
        operation: "modified",
        path: "metadata.lastUpdated",
        oldValue: null,
        newValue: expect.any(Number),
      }),
    ]));
  });

  it("should correctly detect deletions when comparing two contexts", () => {
    const service = new ContextualStateDiffingService();
    const oldContext = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi there" }],
      metadata: { count: 2, lastUpdated: 1678886400000 },
    };
    const newContext = {
      messages: [{ type: "user", content: "Hello" }],
      metadata: { count: 1 },
    };

    const diff = service.compare(oldContext, newContext, 'structural');

    expect(diff).toHaveLength(2);
    expect(diff).toEqual(expect.arrayContaining([
      expect.objectContaining({
        operation: "deleted",
        path: "messages[1]",
        oldValue: { type: "assistant", content: "Hi there" },
        newValue: null,
      }),
      expect.objectContaining({
        operation: "modified",
        path: "metadata.count",
        oldValue: 2,
        newValue: 1,
      }),
    ]));
  });

  it("should detect no changes when comparing identical contexts", () => {
    const service = new ContextualStateDiffingService();
    const context = {
      messages: [{ type: "user", content: "Hello" }],
      metadata: { count: 1, lastUpdated: 12345 },
    };

    const diff = service.compare(context, context, 'structural');

    expect(diff).toHaveLength(0);
  });
});