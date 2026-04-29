import { describe, it, expect } from "vitest";
import {
  StatefulGraphUpdate,
  Node,
  Edge,
} from "../src/visualization/stateful-tool-dependency-graph-visualizer-v130";

describe("StatefulGraphUpdate", () => {
  it("should correctly process an initial state update", () => {
    const initialUpdate: StatefulGraphUpdate = {
      step: 0,
      nodes: [
        { id: "user1", label: "User Input", type: "user" },
        { id: "toolA", label: "Tool A", type: "tool" },
      ],
      edges: [
        { sourceId: "user1", targetId: "toolA", relationship: "calls" },
      ],
      changes: {
        addedNodes: ["toolA"],
        removedNodes: [],
        addedEdges: [
          { sourceId: "user1", targetId: "toolA", relationship: "calls" },
        ],
        removedEdges: [],
      },
    };
    expect(initialUpdate.step).toBe(0);
    expect(initialUpdate.nodes).toHaveLength(2);
    expect(initialUpdate.edges).toHaveLength(1);
    expect(initialUpdate.changes.addedNodes).toEqual(["toolA"]);
  });

  it("should handle subsequent updates with node and edge changes", () => {
    const subsequentUpdate: StatefulGraphUpdate = {
      step: 1,
      nodes: [
        { id: "user1", label: "User Input", type: "user" },
        { id: "toolA", label: "Tool A", type: "tool" },
        { id: "assistant1", label: "Assistant Response", type: "assistant" },
      ],
      edges: [
        { sourceId: "user1", targetId: "toolA", relationship: "calls" },
        { sourceId: "toolA", targetId: "assistant1", relationship: "returns" },
      ],
      changes: {
        addedNodes: ["assistant1"],
        removedNodes: [],
        addedEdges: [
          { sourceId: "toolA", targetId: "assistant1", relationship: "returns" },
        ],
        removedEdges: [],
      },
    };
    expect(subsequentUpdate.step).toBe(1);
    expect(subsequentUpdate.nodes).toHaveLength(3);
    expect(subsequentUpdate.edges).toHaveLength(2);
    expect(subsequentUpdate.changes.addedNodes).toEqual(["assistant1"]);
    expect(subsequentUpdate.changes.addedEdges).toHaveLength(1);
  });

  it("should correctly reflect node and edge removals", () => {
    const removalUpdate: StatefulGraphUpdate = {
      step: 2,
      nodes: [
        { id: "user1", label: "User Input", type: "user" },
        { id: "toolA", label: "Tool A", type: "tool" },
      ],
      edges: [
        { sourceId: "user1", targetId: "toolA", relationship: "calls" },
      ],
      changes: {
        addedNodes: [],
        removedNodes: ["toolA"],
        addedEdges: [],
        removedEdges: [
          { sourceId: "user1", targetId: "toolA", relationship: "calls" },
        ],
      },
    };
    expect(removalUpdate.step).toBe(2);
    expect(removalUpdate.nodes).toHaveLength(2);
    expect(removalUpdate.edges).toHaveLength(1);
    expect(removalUpdate.changes.removedNodes).toEqual(["toolA"]);
    expect(removalUpdate.changes.removedEdges).toHaveLength(1);
  });
});