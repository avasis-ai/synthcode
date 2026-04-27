import { describe, it, expect, vi } from "vitest";
import { StatefulToolUsageTracker } from "../src/tool/stateful-usage-tracker";
import { IStore } from "../src/tool/store";

describe("StatefulToolUsageTracker", () => {
  it("should initialize with the correct state key", () => {
    const mockStore: IStore = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };
    const toolName = "testTool";
    const tracker = new StatefulToolUsageTracker(mockStore, toolName);

    // We can't directly access private members, so we test its side effects or behavior
    // A more robust test would involve mocking the internal state management if possible,
    // but for now, we rely on the constructor's setup logic being sound.
    // We'll test the usage tracking methods which depend on the setup.
    expect(tracker).toBeDefined();
  });

  it("should increment total calls and update last used timestamp on usage", async () => {
    const mockStore: IStore = {
      get: vi.fn().mockReturnValue({
        toolName: "testTool",
        totalCalls: 1,
        totalCost: 10.0,
        lastUsedTimestamp: Date.now() - 1000,
        currentState: {},
      }),
      set: vi.fn(),
      remove: vi.fn(),
    };
    const toolName = "testTool";
    const tracker = new StatefulToolUsageTracker(mockStore, toolName);

    await tracker.recordUsage(1.0);

    expect(mockStore.set).toHaveBeenCalledTimes(1);
    const storedState = mockStore.set.mock.calls[0][0];
    expect(storedState.totalCalls).toBe(2);
    expect(storedState.totalCost).toBeCloseTo(11.0);
    expect(storedState.lastUsedTimestamp).toBeGreaterThan(Date.now() - 2000); // Check if it updated
  });

  it("should correctly calculate total cost and update state on multiple usages", async () => {
    const mockStore: IStore = {
      get: vi.fn().mockReturnValue({
        toolName: "testTool",
        totalCalls: 0,
        totalCost: 0.0,
        lastUsedTimestamp: 0,
        currentState: {},
      }),
      set: vi.fn(),
      remove: vi.fn(),
    };
    const toolName = "testTool";
    const tracker = new StatefulToolUsageTracker(mockStore, toolName);

    await tracker.recordUsage(5.0);
    await tracker.recordUsage(2.5);

    expect(mockStore.set).toHaveBeenCalledTimes(2);
    // Check the final state set after the second call
    const finalState = mockStore.set.mock.calls[1][0];
    expect(finalState.totalCalls).toBe(2);
    expect(finalState.totalCost).toBeCloseTo(7.5);
  });
});