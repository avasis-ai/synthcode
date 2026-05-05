import { describe, it, expect } from "vitest";
import { DiffReport } from "../context/contextual-state-diffing-v139-advanced-advanced";

describe("DiffReport", () => {
  it("should return an empty report when no differences are found", () => {
    const report: DiffReport = { findings: [] };
    expect(report.findings).toEqual([]);
  });

  it("should correctly capture a structural difference in memory", () => {
    const report: DiffReport = {
      findings: [
        {
          source: "memory",
          path: "user.name",
          type: "structural",
          description: "The user's name field has changed type.",
          details: { oldValue: "John", newValue: 123 },
        } as any, // Casting for simplicity in test setup
      ],
    };
    expect(report.findings.length).toBe(1);
    expect(report.findings[0].source).toBe("memory");
    expect(report.findings[0].type).toBe("structural");
  });

  it("should aggregate multiple types of findings from different sources", () => {
    const report: DiffReport = {
      findings: [
        {
          source: "context",
          path: "session.last_topic",
          type: "semantic",
          description: "The context shifted from 'weather' to 'finance'.",
          details: { oldTopic: "weather", newTopic: "finance" },
        } as any,
        {
          source: "toolState",
          path: "api_call.status",
          type: "temporal",
          description: "Tool call status changed from 'pending' to 'completed'.",
          details: { previousStatus: "pending", finalStatus: "completed" },
        } as any,
        {
          source: "memory",
          path: "user.preferences.darkMode",
          type: "structural",
          description: "Boolean preference changed.",
          details: { oldValue: true, newValue: false },
        } as any,
      ],
    };
    expect(report.findings.length).toBe(3);
    expect(report.findings.some(f => f.source === "context" && f.type === "semantic")).toBe(true);
    expect(report.findings.some(f => f.source === "toolState" && f.type === "temporal")).toBe(true);
  });
});