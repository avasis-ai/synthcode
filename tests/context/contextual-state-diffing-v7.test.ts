import { describe, it, expect } from "vitest";
import {
  ContextualStateDiffingV7,
  StateDifference,
  ContextualStateDiffReport,
} from "../context/contextual-state-diffing-v7";

describe("ContextualStateDiffingV7", () => {
  it("should correctly identify simple value changes", () => {
    const initialContext = {
      user: { id: "u1", name: "Alice" },
      settings: { theme: "dark", notifications: true },
    };
    const updatedContext = {
      user: { id: "u1", name: "Alice" },
      settings: { theme: "light", notifications: true },
    };
    const constraints = [
      { key: "settings.theme", maxAgeMs: 0, maxSizeBytes: 100 },
    ];

    const report = ContextualStateDiffingV7.diff(
      initialContext,
      updatedContext,
      constraints
    );

    expect(report.differences).toHaveLength(1);
    const themeDiff = report.differences.find((d) => d.key === "settings.theme");
    expect(themeDiff).toBeDefined();
    expect(themeDiff!.oldValue).toBe("dark");
    expect(themeDiff!.newValue).toBe("light");
  });

  it("should ignore unchanged values and report only necessary changes", () => {
    const initialContext = {
      user: { id: "u1", name: "Alice", lastLogin: 1678886400000 },
      session: "active",
    };
    const updatedContext = {
      user: { id: "u1", name: "Alice", lastLogin: 1678886400000 },
      session: "active",
    };
    const constraints: any[] = [];

    const report = ContextualStateDiffingV7.diff(
      initialContext,
      updatedContext,
      constraints
    );

    expect(report.differences).toHaveLength(0);
    expect(report.violations).toHaveLength(0);
  });

  it("should report resource constraint violations when data size exceeds limits", () => {
    const initialContext = {
      data: "short string",
    };
    const updatedContext = {
      data: "a".repeat(200), // Larger data
    };
    const constraints = [
      { key: "data", maxAgeMs: 0, maxSizeBytes: 100 },
    ];

    const report = ContextualStateDiffingV7.diff(
      initialContext,
      updatedContext,
      constraints
    );

    expect(report.differences).toHaveLength(1);
    const violation = report.differences.find((d) => d.key === "data")?.violation;
    expect(violation).toBeDefined();
    expect(violation!.violationType).toBe("resource");
    expect(violation!.message).toContain("exceeds resource limit");
  });
});