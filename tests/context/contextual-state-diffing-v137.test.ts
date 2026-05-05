import { describe, it, expect } from "vitest";
import { StateDiff } from "../src/context/contextual-state-diffing-v137";

describe("StateDiff", () => {
  it("should correctly calculate the diff when state changes significantly", () => {
    const initialState: any = {
      user: "Hello",
      data: [1, 2],
      settings: { theme: "dark" },
    };
    const newState: any = {
      user: "Hi there",
      data: [1, 2, 3],
      settings: { theme: "light", notifications: true },
    };
    const diff: StateDiff = {
      diffedState: {
        user: "Hi there",
        data: [1, 2, 3],
        settings: { theme: "light", notifications: true },
      },
      constraintViolation: {
        violated: false,
        reason: "No violation",
      },
    };

    expect(diff.diffedState.user).toBe("Hi there");
    expect(diff.diffedState.data).toEqual([1, 2, 3]);
    expect(diff.constraintViolation.violated).toBe(false);
  });

  it("should report constraint violation when resource usage exceeds limits", () => {
    const initialState: any = {
      resourceUsage: 100,
    };
    const newState: any = {
      resourceUsage: 150,
    };
    const diff: StateDiff = {
      diffedState: {
        resourceUsage: 150,
      },
      constraintViolation: {
        violated: true,
        reason: "CPU usage exceeded 120 threshold",
      },
    };

    expect(diff.diffedState.resourceUsage).toBe(150);
    expect(diff.constraintViolation.violated).toBe(true);
    expect(diff.constraintViolation.reason).toContain("CPU usage");
  });

  it("should show no difference when state remains unchanged", () => {
    const initialState: any = {
      user: "Hello",
      data: [1, 2],
      settings: { theme: "dark" },
    };
    const newState: any = {
      user: "Hello",
      data: [1, 2],
      settings: { theme: "dark" },
    };
    const diff: StateDiff = {
      diffedState: {
        user: "Hello",
        data: [1, 2],
        settings: { theme: "dark" },
      },
      constraintViolation: {
        violated: false,
        reason: "No change detected",
      },
    };

    expect(diff.diffedState).toEqual(initialState);
    expect(diff.constraintViolation.violated).toBe(false);
    expect(diff.constraintViolation.reason).toContain("No change");
  });
});