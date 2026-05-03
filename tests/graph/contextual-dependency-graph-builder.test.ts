import { describe, it, expect } from "vitest";
import { ContextualDependencyGraphBuilder } from "../src/graph/contextual-dependency-graph-builder";
import { AgentContext, Message } from "../src/graph/types";

describe("ContextualDependencyGraphBuilder", () => {
  it("should build an empty graph when no dependencies are found", () => {
    const mockContext: AgentContext = {
      memory: {
        get: jest.fn(),
        set: jest.fn(),
      },
      // Add other required properties if necessary for a full mock
    };
    const mockSteps: Message[] = [
      { id: "step1", content: "Initial step", context: {} },
      { id: "step2", content: "Another step", context: {} },
    ];

    const builder = new ContextualDependencyGraphBuilder(mockContext, mockSteps);
    const graph = builder.buildGraph();

    expect(graph).toBeInstanceOf(Array);
    expect(graph.length).toBe(0);
  });

  it("should create dependency edges when memory dependencies are present", () => {
    const mockContext: AgentContext = {
      memory: {
        get: jest.fn(),
        set: jest.fn(),
      },
      // Mocking a scenario where memory access implies dependency
    };
    const mockSteps: Message[] = [
      { id: "stepA", content: "Uses memory A", context: { memory_read: true } },
      { id: "stepB", content: "Writes to memory B", context: { memory_write: true } },
    ];

    // Mocking the internal logic to ensure edges are created based on context
    // Since we cannot easily mock private methods, we rely on the public interface
    // and assume the builder correctly processes the context.
    const builder = new ContextualDependencyGraphBuilder(mockContext, mockSteps);
    const graph = builder.buildGraph();

    // Expect at least one edge if the context suggests dependencies
    expect(graph.length).toBeGreaterThanOrEqual(1);
  });

  it("should handle a mix of steps with and without dependencies", () => {
    const mockContext: AgentContext = {
      memory: {
        get: jest.fn(),
        set: jest.fn(),
      },
    };
    const mockSteps: Message[] = [
      { id: "step1", content: "No dependency", context: {} },
      { id: "step2", content: "Depends on memory", context: { memory_read: true } },
      { id: "step3", content: "Another step", context: {} },
    ];

    const builder = new ContextualDependencyGraphBuilder(mockContext, mockSteps);
    const graph = builder.buildGraph();

    // Expect the graph to contain edges only for steps that interact with memory
    expect(graph.length).toBeGreaterThanOrEqual(1);
  });
});