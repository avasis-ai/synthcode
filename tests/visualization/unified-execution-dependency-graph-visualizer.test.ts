import { describe, it, expect } from "vitest";
import { GraphPayload } from "../src/visualization/unified-execution-dependency-graph-visualizer";
import { buildGraphPayload } from "../src/visualization/unified-execution-dependency-graph-visualizer";

describe("buildGraphPayload", () => {
  it("should return an empty graph payload when given no messages", () => {
    const graphPayload = buildGraphPayload([]);
    expect(graphPayload).toEqual({ nodes: [], edges: [] });
  });

  it("should correctly build a graph payload from a simple sequence of messages", () => {
    const messages = [
      { type: "user", content: "Start process" },
      { type: "assistant", content: "Processing step 1" },
      { type: "tool_result", content: "Tool output for step 1" },
    ];
    const graphPayload = buildGraphPayload(messages);
    expect(graphPayload.nodes.length).toBe(3);
    expect(graphPayload.edges.length).toBe(2);
  });

  it("should handle multiple tool calls and dependencies", () => {
    const messages = [
      { type: "user", content: "Initial request" },
      { type: "assistant", content: "Call tool A" },
      { type: "tool_result", content: "Result A" },
      { type: "assistant", content: "Call tool B based on A" },
      { type: "tool_result", content: "Result B" },
    ];
    const graphPayload = buildGraphPayload(messages);
    expect(graphPayload.nodes.length).toBeGreaterThanOrEqual(4);
    expect(graphPayload.edges.length).toBeGreaterThanOrEqual(3);
  });
});