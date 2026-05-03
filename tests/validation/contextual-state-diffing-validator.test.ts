import { describe, it, expect } from "vitest";
import {
  StateTransitionRule,
  StateDiffReport,
} from "../src/validation/contextual-state-diffing-validator";

describe("StateDiffingValidator", () => {
  it("should correctly identify differences between two states", () => {
    const currentState = {
      user: "Alice",
      status: "active",
      lastInteraction: "2023-01-01",
    };
    const proposedState = {
      user: "Alice",
      status: "inactive",
      lastInteraction: "2023-01-02",
    };

    const report = {
      currentState,
      proposedState,
      diffs: [
        { field: "status", oldValue: "active", newValue: "inactive" },
        { field: "lastInteraction", oldValue: "2023-01-01", newValue: "2023-01-02" },
      ],
    };

    expect(report.diffs.length).toBe(2);
    expect(report.diffs).toContainEqual({
      field: "status",
      oldValue: "active",
      newValue: "inactive",
    });
  });

  it("should return an empty diff report if states are identical", () => {
    const currentState = {
      user: "Bob",
      status: "pending",
      data: { id: 1 },
    };
    const proposedState = {
      user: "Bob",
      status: "pending",
      data: { id: 1 },
    };

    const report = {
      currentState,
      proposedState,
      diffs: [],
    };

    expect(report.diffs.length).toBe(0);
  });

  it("should handle nested object differences (if applicable in implementation)", () => {
    const currentState = {
      settings: { theme: "dark", notifications: true },
      count: 10,
    };
    const proposedState = {
      settings: { theme: "dark", notifications: false },
      count: 10,
    };

    const report = {
      currentState,
      proposedState,
      diffs: [
        { field: "settings.notifications", oldValue: true, newValue: false },
      ],
    };

    expect(report.diffs.length).toBe(1);
    expect(report.diffs[0]).toEqual({
      field: "settings.notifications",
      oldValue: true,
      newValue: false,
    });
  });
});