import { describe, it, expect } from "vitest";
import { StatefulToolDependencyGraphBuilder } from "../../../src/dependency/stateful-tool-dependency-graph-builder";

describe("StatefulToolDependencyGraphBuilder", () => {
  it("should correctly build a simple linear dependency graph", () => {
    const builder = new StatefulToolDependencyGraphBuilder();
    builder.addToolCall("toolA", { input: "data1" });
    builder.addToolCall("toolB", { input: "data2" });

    const graph = builder.buildGraph();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    expect(graph.nodes[0].type).toBe("tool_call");
    expect(graph.nodes[1].type).toBe("tool_call");
    expect(graph.edges[0].source).toBe("toolA");
    expect(graph.edges[0].target).toBe("toolB");
  });

  it("should handle multiple tool calls from the same source tool", () => {
    const builder = new StatefulToolDependencyGraphBuilder();
    builder.addToolCall("toolA", { input: "call1" });
    builder.addToolCall("toolA", { input: "call2" });

    const graph = builder.buildGraph();

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    // The graph should represent the sequence, even if the source name is the same
    expect(graph.edges[0].source).toBe("toolA");
    expect(graph.edges[0].target).toBe("toolA");
  });

  it("should build a graph when mixed with user input nodes", () => {
    const builder = new StatefulToolDependencyGraphBuilder();
    builder.addUserInput("initial prompt");
    builder.addToolCall("toolA", { input: "data1" });
    builder.addToolCall("toolB", { input: "data2" });

    const graph = builder.buildGraph();

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
    // Check the sequence: User -> ToolA -> ToolB
    expect(graph.edges[0].source).toBe("user_input");
    expect(graph.edges[0].target).toBe("toolA");
    expect(graph.edges[1].source).toBe("toolA");
    expect(graph.edges[1].target).toBe("toolB");
  });
});