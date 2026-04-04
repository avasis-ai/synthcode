import { describe, it, expect } from "vitest";
import { ToolExecutionGuard } from "../src/tools/tool-execution-guard";

describe("ToolExecutionGuard", () => {
  it("should execute the tool function with correct arguments", async () => {
    const mockToolFn = async (input: Record<string, unknown>) => {
      expect(input).toEqual({ query: "test" });
      return "tool_result";
    };
    const guard = new ToolExecutionGuard();
    const context = { userId: "user123" };
    const toolInput = { query: "test" };

    const result = await guard.execute(mockToolFn, context, toolInput);
    expect(result).toBe("tool_result");
  });

  it("should handle tool functions that throw an error", async () => {
    const mockToolFn = async () => {
      throw new Error("Tool failed");
    };
    const guard = new ToolExecutionGuard();
    const context = {};
    const toolInput = {};

    await expect(guard.execute(mockToolFn, context, toolInput)).rejects.toThrow("Tool failed");
  });

  it("should return the result of the tool function when successful", async () => {
    const mockToolFn = async (input: Record<string, unknown>) => {
      return { data: "success" };
    };
    const guard = new ToolExecutionGuard();
    const context = {};
    const toolInput = { id: 1 };

    const result = await guard.execute(mockToolFn, context, toolInput);
    expect(result).toEqual({ data: "success" });
  });
});