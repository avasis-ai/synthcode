import { describe, it, expect } from "vitest";
import {
  calculateStateDiff,
  TemporalContext,
  TemporalStateDiffCalculator,
} from "../src/context/contextual-state-diffing-v13";

describe("calculateStateDiff", () => {
  it("should return an empty object when states are identical", () => {
    const currentState: Record<string, unknown> = {
      user: "hello",
      count: 1,
      data: { a: 1 },
    };
    const previousState: Record<string, unknown> = {
      user: "hello",
      count: 1,
      data: { a: 1 },
    };
    const context: TemporalContext = {
      timestamp: Date.now(),
      timeWindowMs: 1000,
    };

    const diff = calculateStateDiff(currentState, previousState, context);
    expect(diff).toEqual({});
  });

  it("should detect changes in primitive types", () => {
    const currentState: Record<string, unknown> = {
      user: "hello world",
      count: 2,
      isActive: true,
    };
    const previousState: Record<string, unknown> = {
      user: "hello",
      count: 1,
      isActive: true,
    };
    const context: TemporalContext = {
      timestamp: Date.now(),
      timeWindowMs: 1000,
    };

    const diff = calculateStateDiff(currentState, previousState, context);
    expect(diff).toEqual({
      user: "hello world",
      count: 2,
    });
  });

  it("should detect changes in nested object structures", () => {
    const currentState: Record<string, unknown> = {
      metadata: {
        lastUpdated: Date.now(),
        session: "active",
        items: [1, 2],
      },
      score: 99,
    };
    const previousState: Record<string, unknown> = {
      metadata: {
        lastUpdated: 1600000000000,
        session: "inactive",
        items: [1],
      },
      score: 50,
    };
    const context: TemporalContext = {
      timestamp: Date.now(),
      timeWindowMs: 1000,
    };

    const diff = calculateStateDiff(currentState, previousState, context);
    expect(diff).toEqual({
      metadata: {
        lastUpdated: expect.any(Number),
        session: "active",
        items: [1, 2],
      },
      score: 99,
    });
  });
});