import { describe, it, expect } from "vitest";
import { ToolExecutionGuardChain, Guard } from "../src/guards/tool-execution-guard-chain";
import { Message } from "../src/guards/types";

describe("ToolExecutionGuardChain", () => {
  it("should return success if all guards pass", async () => {
    const mockGuard1: Guard = {
      name: "guard1",
      execute: async () => ({ success: true }),
    };
    const mockGuard2: Guard = {
      name: "guard2",
      execute: async () => ({ success: true }),
    };
    const chain = new ToolExecutionGuardChain([mockGuard1, mockGuard2]);
    const context = { message: {} as Message, history: [] };

    const result = await chain.run(context);
    expect(result.success).toBe(true);
  });

  it("should stop and return error if any guard fails", async () => {
    const mockGuard1: Guard = {
      name: "guard1",
      execute: async () => ({ success: true }),
    };
    const mockGuard2: Guard = {
      name: "guard2",
      execute: async () => ({ success: false, error: "Guard failed" }),
    };
    const mockGuard3: Guard = {
      name: "guard3",
      execute: async () => ({ success: true }), // Should not be called
    };
    const chain = new ToolExecutionGuardChain([mockGuard1, mockGuard2, mockGuard3]);
    const context = { message: {} as Message, history: [] };

    const result = await chain.run(context);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Guard failed");
  });

  it("should handle an empty guard list gracefully", async () => {
    const chain = new ToolExecutionGuardChain([]);
    const context = { message: {} as Message, history: [] };

    const result = await chain.run(context);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
});