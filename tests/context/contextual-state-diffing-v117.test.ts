import { describe, it, expect } from "vitest";
import { ContextualPayload, ContextualDiff } from "../context/contextual-state-diffing-v117";
import { diffContextualState } from "../context/contextual-state-diffing-v117";

describe("diffContextualState", () => {
  it("should correctly calculate the state difference for simple changes", () => {
    const payload1: ContextualPayload = {
      state: { count: 1, data: "initial" },
      timestamp: 1000,
      resourceUsage: { cpuMs: 10, memoryBytes: 100, networkBytes: 5 },
    };
    const payload2: ContextualPayload = {
      state: { count: 2, data: "updated" },
      timestamp: 1100,
      resourceUsage: { cpuMs: 15, memoryBytes: 120, networkBytes: 10 },
    };

    const diff = diffContextualState(payload1, payload2);

    expect(diff.stateDiff).toEqual({
      count: 2,
      data: "updated",
    });
    expect(diff.temporalDelta).toBe(100);
    expect(diff.resourceDelta).toEqual({
      cpuMs: 5,
      memoryBytes: 20,
      networkBytes: 5,
    });
    expect(diff.isValid).toBe(true);
  });

  it("should handle cases where the state has not changed", () => {
    const payload1: ContextualPayload = {
      state: { user: "Alice", items: [1, 2] },
      timestamp: 1000,
      resourceUsage: { cpuMs: 10, memoryBytes: 100, networkBytes: 5 },
    };
    const payload2: ContextualPayload = {
      state: { user: "Alice", items: [1, 2] },
      timestamp: 1000,
      resourceUsage: { cpuMs: 10, memoryBytes: 100, networkBytes: 5 },
    };

    const diff = diffContextualState(payload1, payload2);

    expect(diff.stateDiff).toEqual({});
    expect(diff.temporalDelta).toBe(0);
    expect(diff.resourceDelta).toEqual({
      cpuMs: 0,
      memoryBytes: 0,
      networkBytes: 0,
    });
    expect(diff.isValid).toBe(true);
  });

  it("should correctly calculate diff when only resource usage changes", () => {
    const payload1: ContextualPayload = {
      state: { key: "value" },
      timestamp: 1000,
      resourceUsage: { cpuMs: 5, memoryBytes: 50, networkBytes: 1 },
    };
    const payload2: ContextualPayload = {
      state: { key: "value" },
      timestamp: 1000,
      resourceUsage: { cpuMs: 20, memoryBytes: 70, networkBytes: 10 },
    };

    const diff = diffContextualState(payload1, payload2);

    expect(diff.stateDiff).toEqual({});
    expect(diff.temporalDelta).toBe(0);
    expect(diff.resourceDelta).toEqual({
      cpuMs: 15,
      memoryBytes: 20,
      networkBytes: 9,
    });
    expect(diff.isValid).toBe(true);
  });
});