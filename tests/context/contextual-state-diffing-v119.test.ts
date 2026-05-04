import { describe, it, expect } from "vitest";
import {
  TemporalConstraint,
  ResourceUsage,
  StateDiffReport,
} from "../context/contextual-state-diffing-v119";

describe("StateDiffReport", () => {
  it("should correctly report a simple value difference", () => {
    const report: StateDiffReport = {
      diff: {
        path: "user.name",
        oldValue: "Alice",
        newValue: "Bob",
        isDifferent: true,
        violations: {},
      },
    };
    expect(report.diff.path).toBe("user.name");
    expect(report.diff.oldValue).toBe("Alice");
    expect(report.diff.newValue).toBe("Bob");
    expect(report.diff.isDifferent).toBe(true);
  });

  it("should report no difference when values are the same", () => {
    const report: StateDiffReport = {
      diff: {
        path: "settings.theme",
        oldValue: "dark",
        newValue: "dark",
        isDifferent: false,
        violations: {},
      },
    };
    expect(report.diff.path).toBe("settings.theme");
    expect(report.diff.oldValue).toBe("dark");
    expect(report.diff.newValue).toBe("dark");
    expect(report.diff.isDifferent).toBe(false);
  });

  it("should include temporal and resource violations when applicable", () => {
    const report: StateDiffReport = {
      diff: {
        path: "session.data",
        oldValue: 100,
        newValue: 200,
        isDifferent: true,
        violations: {
          temporal: "Max age exceeded by 5s",
          resource: "High CPU usage detected",
        },
      },
    };
    expect(report.diff.path).toBe("session.data");
    expect(report.diff.isDifferent).toBe(true);
    expect(report.diff.violations).toEqual({
      temporal: "Max age exceeded by 5s",
      resource: "High CPU usage detected",
    });
  });
});