import { describe, it, expect } from "vitest";
import { ToolDependencyGraphResolver } from "../src/tool/dependency-graph-resolver";

describe("ToolDependencyGraphResolver", () => {
  it("should correctly build a dependency graph for simple tool calls", () => {
    const toolDefinitions: Record<string, any> = {
      "toolA": { name: "toolA", inputs: {}, outputs: { resultA: { description: "A result", type: "string" } } },
      "toolB": { name: "toolB", inputs: { inputA: { description: "A input", type: "string" } }, outputs: { resultB: { description: "B result", type: "string" } } },
    };
    const context: any = { toolDefinitions, initialInputs: {} };
    const resolver = new ToolDependencyGraphResolver(context);

    // Simulate a call that depends on toolA's output
    const graph = resolver.resolveDependencies(["toolB"], {
      toolCalls: [{ toolName: "toolB", inputs: { inputA: "some value" } }],
    });

    // Expect toolB to depend on toolA if toolA's output is needed for toolB's input
    // For this simple test, we check if the graph contains the expected dependency structure
    expect(graph.get("toolB")).toContain("toolA");
  });

  it("should handle no dependencies when all inputs are provided initially", () => {
    const toolDefinitions: Record<string, any> = {
      "toolA": { name: "toolA", inputs: {}, outputs: { resultA: { description: "A result", type: "string" } } },
      "toolB": { name: "toolB", inputs: { inputA: { description: "A input", type: "string" } }, outputs: { resultB: { description: "B result", type: "string" } } },
    };
    const context: any = { toolDefinitions, initialInputs: { inputA: "initial value" } };
    const resolver = new ToolDependencyGraphResolver(context);

    const graph = resolver.resolveDependencies(["toolB"], {
      toolCalls: [{ toolName: "toolB", inputs: { inputA: "some value" } }],
    });

    // If all inputs are provided, the dependency graph should be empty or minimal
    expect(graph.get("toolB")).toBeUndefined();
  });

  it("should correctly identify missing dependencies when tool outputs are required", () => {
    const toolDefinitions: Record<string, any> = {
      "toolA": { name: "toolA", inputs: {}, outputs: { resultA: { description: "A result", type: "string" } } },
      "toolB": { name: "toolB", inputs: { inputA: { description: "A input", type: "string" } }, outputs: { resultB: { description: "B result", type: "string" } } },
    };
    const context: any = { toolDefinitions, initialInputs: {} };
    const resolver = new ToolDependencyGraphResolver(context);

    // Simulate a call that requires toolA's output, but toolA hasn't been called or its output isn't available
    const graph = resolver.resolveDependencies(["toolB"], {
      toolCalls: [{ toolName: "toolB", inputs: { inputA: "some value" } }],
    });

    // We expect toolB to depend on toolA because its input might rely on toolA's output
    expect(graph.get("toolB")).toContain("toolA");
  });
});