import { describe, it, expect } from "vitest";
import { ToolChainExecutor } from "../../src/toolchain/index.js";
import type { ToolChainStep, ToolChainContext } from "../../src/toolchain/index.js";

describe("ToolChainExecutor", () => {
  it("should initialize with steps", () => {
    const executor = new ToolChainExecutor([]);
    expect(executor).toBeDefined();
  });

  it("should execute a single tool step", async () => {
    const mockContext: ToolChainContext = {
      history: [],
      state: { initialData: "test" },
    };
    const mockStep: ToolChainStep = {
      toolName: "mockTool",
      inputMap: {
        inputA: (state: Record<string, any>) => state.initialData,
      },
    };
    const executor = new ToolChainExecutor([mockStep]);
    const result = await executor.execute(mockContext);
    expect(result).toBeDefined();
    expect(result.mockTool).toBeDefined();
  });

  it("should validate a valid chain", () => {
    const steps: ToolChainStep[] = [
      {
        toolName: "tool1",
        inputMap: {
          inputA: (state: Record<string, any>) => state.foo,
        },
      },
    ];
    const result = ToolChainExecutor.validateChain(steps);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect invalid input map", () => {
    const steps: ToolChainStep[] = [
      {
        toolName: "tool1",
        inputMap: {
          inputA: "not a function" as any,
        },
      },
    ];
    const result = ToolChainExecutor.validateChain(steps);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
