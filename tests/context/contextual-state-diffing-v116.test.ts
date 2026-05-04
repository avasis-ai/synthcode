import { describe, it, expect } from "vitest";
import { ContextualStateDiffingV116Service } from "../src/context/contextual-state-diffing-v116";

describe("ContextualStateDiffingV116Service", () => {
  it("should correctly report a significant change when state differs substantially", () => {
    const service = new ContextualStateDiffingV116Service({
      constraints: {
        maxTimeDeltaMs: 1000,
        maxCpuUsageThreshold: 0.8,
      },
    });

    const oldState = {
      messages: [{ type: "user", content: "Hello" }],
      metadata: { session_id: "abc" },
    };
    const newState = {
      messages: [{ type: "user", content: "Hello" }, { type: "assistant", content: "Hi there!" }],
      metadata: { session_id: "abc" },
    };

    const report = service.diff(oldState, newState);

    expect(report.isSignificantChange).toBe(true);
    expect(report.diff).toEqual(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ type: "assistant", content: "Hi there!" }),
        ]),
      })
    );
  });

  it("should report no significant change when state is identical", () => {
    const service = new ContextualStateDiffingV116Service({
      constraints: {
        maxTimeDeltaMs: 1000,
        maxCpuUsageThreshold: 0.8,
      },
    });

    const state = {
      messages: [{ type: "user", content: "Test" }],
      metadata: { session_id: "xyz" },
    };

    const report = service.diff(state, state);

    expect(report.isSignificantChange).toBe(false);
    expect(report.diff).toEqual({});
  });

  it("should handle minor changes within constraints as non-significant", () => {
    const service = new ContextualStateDiffingV116Service({
      constraints: {
        maxTimeDeltaMs: 5000,
        maxCpuUsageThreshold: 0.9,
      },
    });

    const oldState = {
      messages: [{ type: "user", content: "Initial" }],
      metadata: { session_id: "def", last_update: 1678886400000 },
    };
    const newState = {
      messages: [{ type: "user", content: "Initial" }],
      metadata: { session_id: "def", last_update: 1678886400001 }, // Small change
    };

    const report = service.diff(oldState, newState);

    expect(report.isSignificantChange).toBe(false);
    expect(report.reason).toContain("within constraints");
  });
});