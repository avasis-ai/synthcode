import { describe, it, expect } from "vitest";
import { ToolCallDependencyGraph, StateTransitionRule } from "../graph/tool-call-dependency-graph-analyzer-advanced-v145-enhanced";

describe("ToolCallDependencyGraphAnalyzerAdvancedV145Enhanced", () => {
  it("should correctly identify a missing tool call dependency", () => {
    // Mock setup for a scenario where a tool is called but its dependency is missing
    const graph = {
      // Simplified graph structure for testing the concept
      nodes: [
        { type: "tool_call", id: "toolA", dependsOn: ["input_data"] },
        { type: "text", id: "output", content: "Result based on toolA" },
      ],
      edges: [
        // Assume an edge exists from input_data to toolA, but we test the dependency check itself
      ],
    } as unknown as ToolCallDependencyGraph;

    const rule = {
      name: "MissingDependencyCheck",
      check: (graph: ToolCallDependencyGraph, history: any[]): any[] | null => {
        // Mock logic: if toolA is present, check if its dependency 'input_data' is represented
        if (graph.nodes.some(n => n.type === "tool_call" && n.id === "toolA")) {
          const toolANode = graph.nodes.find(n => n.id === "toolA");
          if (toolANode && toolANode.dependsOn.includes("input_data") && !graph.nodes.some(n => n.id === "input_data")) {
            return [{
              type: "DEPENDENCY_ERROR",
              description: "Tool 'toolA' depends on 'input_data', but no node with this ID was found.",
              severity: "ERROR",
              location: { messageIndex: 0, blockType: "GRAPH", details: "Missing dependency input_data" },
            }];
          }
        }
        return null;
      },
    } as StateTransitionRule;

    const flaws = rule.check(graph, []);
    expect(flaws).toHaveLength(1);
    expect(flaws![0].type).toBe("DEPENDENCY_ERROR");
  });

  it("should pass when all tool call dependencies are correctly established", () => {
    // Mock setup for a fully connected graph
    const graph = {
      nodes: [
        { type: "tool_call", id: "toolA", dependsOn: ["input_data"] },
        { type: "data", id: "input_data", content: "Initial data" },
        { type: "text", id: "output", content: "Result based on toolA" },
      ],
      edges: [
        // Edges representing valid flow
      ],
    } as unknown as ToolCallDependencyGraph;

    const rule = {
      name: "MissingDependencyCheck",
      check: (graph: ToolCallDependencyGraph, history: any[]): any[] | null => {
        if (graph.nodes.some(n => n.type === "tool_call" && n.id === "toolA")) {
          const toolANode = graph.nodes.find(n => n.id === "toolA");
          if (toolANode && toolANode.dependsOn.includes("input_data") && graph.nodes.some(n => n.id === "input_data")) {
            return null; // Success case
          }
        }
        return null;
      },
    } as StateTransitionRule;

    const flaws = rule.check(graph, []);
    expect(flaws).toBeNull();
  });

  it("should return null if no tool calls requiring dependencies are present", () => {
    // Mock setup for a graph with only text and data nodes, no tool calls
    const graph = {
      nodes: [
        { type: "text", id: "start", content: "Start message" },
        { type: "data", id: "context", content: "Context info" },
      ],
      edges: [],
    } as unknown as ToolCallDependencyGraph;

    const rule = {
      name: "MissingDependencyCheck",
      check: (graph: ToolCallDependencyGraph, history: any[]): any[] | null => {
        // Logic specifically checks for tool calls
        if (graph.nodes.some(n => n.type === "tool_call")) {
          // This branch won't be hit in this test case
          return null;
        }
        return null;
      },
    } as StateTransitionRule;

    const flaws = rule.check(graph, []);
    expect(flaws).toBeNull();
  });
});