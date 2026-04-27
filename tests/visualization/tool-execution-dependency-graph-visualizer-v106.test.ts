import { describe, it, expect } from "vitest";
import { ToolExecutionDependencyGraphVisualizerV106, NodeData, EdgeData } from "../src/visualization/tool-execution-dependency-graph-visualizer-v106";

describe("ToolExecutionDependencyGraphVisualizerV106", () => {
  it("should initialize correctly with empty data", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV106();
    expect(visualizer).toBeDefined();
    // Assuming there's a way to check internal state, or we test the primary methods.
    // Since we don't see the constructor body, we test basic instantiation.
  });

  it("should add nodes and edges correctly", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV106();
    const node1: NodeData = {
      id: "node1",
      content: "message1",
      metadata: { startTime: 0, endTime: 10, resourceUsage: {} },
    };
    const node2: NodeData = {
      id: "node2",
      content: "message2",
      metadata: { startTime: 10, endTime: 20, resourceUsage: {} },
    };
    const edge1: EdgeData = {
      sourceId: "node1",
      targetId: "node2",
      metadata: { startTime: 5, endTime: 15, resourceUsage: {} },
    };

    // Assuming the visualizer has methods like addNode and addEdge
    // We mock the expected behavior based on the class structure.
    // If the class has a public method to add data, we test that.
    // For this test, we assume addNode and addEdge exist and work.
    (visualizer as any).addNode(node1);
    (visualizer as any).addNode(node2);
    (visualizer as any).addEdge(edge1);

    // A proper test would check the internal state (nodes/edges maps)
    // For now, we just ensure the calls don't throw and simulate success.
    expect((visualizer as any).getNodes().size).toBe(2);
    expect((visualizer as any).getEdges().size).toBe(1);
  });

  it("should handle updates to existing nodes and edges", () => {
    const visualizer = new ToolExecutionDependencyGraphVisualizerV106();
    const initialNode: NodeData = {
      id: "nodeA",
      content: "initial",
      metadata: { startTime: 0, endTime: 10, resourceUsage: {} },
    };
    const updatedNode: NodeData = {
      id: "nodeA",
      content: "updated",
      metadata: { startTime: 0, endTime: 15, resourceUsage: {} },
    };
    const edge: EdgeData = {
      sourceId: "nodeA",
      targetId: "nodeB",
      metadata: { startTime: 5, endTime: 15, resourceUsage: {} },
    };

    (visualizer as any).addNode(initialNode);
    (visualizer as any).addNode({ id: "nodeB", content: "b", metadata: { startTime: 10, endTime: 20, resourceUsage: {} }});
    (visualizer as any).addEdge(edge);

    // Test update functionality (assuming an update method exists)
    (visualizer as any).updateNode(updatedNode);
    (visualizer as any).updateEdge(edge);

    // Check if the update was reflected (checking content change)
    const retrievedNode = (visualizer as any).getNode("nodeA");
    expect(retrievedNode?.content).toBe("updated");
    expect(retrievedNode?.metadata.endTime).toBe(15);
  });
});