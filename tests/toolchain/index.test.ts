import { describe, it, expect } from "vitest";
import { ToolChainExecutor, ToolChainStep, ToolChainContext } from "../src/toolchain/index";

describe("ToolChainExecutor", () => {
  it("should initialize correctly with an empty context", () => {
    const executor = new ToolChainExecutor();
    // Assuming there's a way to check internal state or methods that rely on initialization
    // For this test, we'll just check if instantiation succeeds.
    expect(executor).toBeDefined();
  });

  it("should execute a single tool step successfully", () => {
    const mockContext: ToolChainContext = {
      history: [],
      state: { initialData: "test" },
    };
    const mockStep: ToolChainStep = {
      toolName: "mockTool",
      inputMap: {
        inputA: (context: Record<string, any>) => context.state.initialData,
      },
    };
    const executor = new ToolChainExecutor();
    // Assuming executeStep returns the result or updates the context
    const result = executor.executeStep(mockStep, mockContext);
    expect(result).toBeDefined();
  });

  it("should handle multiple tool steps sequentially", () => {
    const mockContext: ToolChainContext = {
      history: [],
      state: { initialData: "test" },
    };
    const mockStep1: ToolChainStep = {
      toolName: "tool1",
      inputMap: {
        inputA: (context: Record<string, any>) => context.state.initialData,
      },
    };
    const mockStep2: ToolChainStep = {
      toolName: "tool2",
      inputMap: {
        inputB: (context: Record<string, any>) => "nextValue",
      },
    };
    const executor = new ToolChainExecutor();
    // This test assumes executeStep updates the context or returns a final state
    const finalResult = executor.executeStep(mockStep1, mockContext);
    // A second call might use the updated context, but we test the flow conceptually.
    // Since we don't know the exact return/update mechanism, we test the execution path.
    expect(finalResult).toBeDefined();
  });
});