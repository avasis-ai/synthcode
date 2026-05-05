import { describe, it, expect } from "vitest";
import { CausalDiffReport, StateChangeNode, CausalLink } from "../src/context/contextual-state-diffing-v123";

describe("CausalDiffReport generation", () => {
  it("should generate a basic report with nodes and no links when no causal relationships exist", () => {
    const nodes: StateChangeNode[] = [
      {
        stateId: "s1",
        timestamp: 100,
        description: "Initial state",
        changes: { user: "A" },
      },
      {
        stateId: "s2",
        timestamp: 200,
        description: "Second state",
        changes: { assistant: "B" },
      },
    ];
    const report: CausalDiffReport = {
      nodes: nodes,
      links: [],
      temporalOrder: [100, 200],
    };

    expect(report.nodes).toHaveLength(2);
    expect(report.links).toHaveLength(0);
    expect(report.temporalOrder).toEqual([100, 200]);
  });

  it("should correctly link states when a clear causal chain is present", () => {
    const nodes: StateChangeNode[] = [
      {
        stateId: "s1",
        timestamp: 100,
        description: "Start",
        changes: { initial: true },
      },
      {
        stateId: "s2",
        timestamp: 200,
        description: "Action taken",
        changes: { result: "success" },
      },
      {
        stateId: "s3",
        timestamp: 300,
        description: "Final state",
        changes: { final: true },
      },
    ];
    const links: CausalLink[] = [
      {
        sourceStateId: "s1",
        targetStateId: "s2",
        cause: "User input triggered action",
      },
      {
        sourceStateId: "s2",
        targetStateId: "s3",
        cause: "Action result determined next step",
      },
    ];
    const report: CausalDiffReport = {
      nodes: nodes,
      links: links,
      temporalOrder: [100, 200, 300],
    };

    expect(report.links).toHaveLength(2);
    expect(report.links[0].sourceStateId).toBe("s1");
    expect(report.links[1].targetStateId).toBe("s3");
  });

  it("should handle multiple independent causal paths", () => {
    const nodes: StateChangeNode[] = [
      {
        stateId: "sA",
        timestamp: 100,
        description: "Path A start",
        changes: { a: 1 },
      },
      {
        stateId: "sB",
        timestamp: 100,
        description: "Path B start",
        changes: { b: 1 },
      },
      {
        stateId: "sC",
        timestamp: 200,
        description: "Path A end",
        changes: { a: 2 },
      },
      {
        stateId: "sD",
        timestamp: 200,
        description: "Path B end",
        changes: { b: 2 },
      },
    ];
    const links: CausalLink[] = [
      {
        sourceStateId: "sA",
        targetStateId: "sC",
        cause: "A progression",
      },
      {
        sourceStateId: "sB",
        targetStateId: "sD",
        cause: "B progression",
      },
    ];
    const report: CausalDiffReport = {
      nodes: nodes,
      links: links,
      temporalOrder: [100, 100, 200, 200],
    };

    expect(report.links).toHaveLength(2);
    expect(report.links.some(link => link.sourceStateId === "sA" && link.targetStateId === "sC")).toBe(true);
    expect(report.temporalOrder).toHaveLength(4);
  });
});