import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../src/graph/tool-call-dependency-graph-visualizer-mermaid-advanced-v140";

describe("GraphBuilder", () => {
  it("should build a basic linear dependency graph", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Start" },
        { role: "assistant", content: "Step 1" },
        { role: "assistant", content: "Step 2" },
      ],
    };
    const builder = new GraphBuilder(context);
    const { mermaid } = builder.buildGraph();

    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("A[Start]");
    expect(mermaid).toContain("B[Step 1]");
    expect(mermaid).toContain("C[Step 2]");
    expect(mermaid).toContain("A --> B");
    expect(mermaid).toContain("B --> C");
  });

  it("should handle conditional branching paths", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Check condition" },
        { role: "assistant", content: "Conditional step" },
      ],
      conditionalPaths: [
        { condition: "success", truePath: "Path A", falsePath: "Path B" },
      ],
    };
    const builder = new GraphBuilder(context);
    const { mermaid } = builder.buildGraph();

    expect(mermaid).toContain("subgraph Condition");
    expect(mermaid).toContain("C{Condition}");
    expect(mermaid).toContain("C -- success --> PathA[Path A]");
    expect(mermaid).toContain("C -- failure --> PathB[Path B]");
  });

  it("should incorporate loop dependencies", () => {
    const context: GraphContext = {
      messages: [
        { role: "user", content: "Loop start" },
        { role: "assistant", content: "Loop body" },
      ],
      loopDependencies: [
        { startNodeId: "LoopStart", endNodeId: "LoopEnd", condition: "continue" },
      ],
    };
    const builder = new GraphBuilder(context);
    const { mermaid } = builder.buildGraph();

    expect(mermaid).toContain("LoopStart[Loop Start]");
    expect(mermaid).toContain("LoopEnd[Loop End]");
    expect(mermaid).toContain("LoopStart -- continue --> LoopBody");
    expect(mermaid).toContain("LoopBody --> LoopStart");
  });
});