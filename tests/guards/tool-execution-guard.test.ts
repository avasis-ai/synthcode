import { describe, it, expect } from "vitest";
import { ToolExecutionGuardChain, Guard } from "../src/guards/tool-execution-guard";

describe("ToolExecutionGuardChain", () => {
  it("should execute preExecute for all guards and update context", async () => {
    const mockGuard1: Guard<any, any> = {
      preExecute: async (context: any) => {
        context.step1 = true;
        return context;
      },
      postExecute: async (result: any) => result,
    };
    const mockGuard2: Guard<any, any> = {
      preExecute: async (context: any) => {
        context.step2 = true;
        return context;
      },
      postExecute: async (result: any) => result,
    };

    const chain = new ToolExecutionGuardChain([mockGuard1, mockGuard2]);
    const initialContext: any = { id: 1 };
    const toolResult: any = { data: "test" };

    const result = await chain.execute(initialContext, toolResult);

    expect(result).toEqual(toolResult);
    expect(initialContext).toEqual({ id: 1, step1: true, step2: true });
  });

  it("should execute postExecute for all guards after successful execution", async () => {
    const mockGuard1: Guard<any, any> = {
      preExecute: async (context: any) => context,
      postExecute: async (result: any) => {
        return { ...result, processedBy1: true };
      },
    };
    const mockGuard2: Guard<any, any> = {
      preExecute: async (context: any) => context,
      postExecute: async (result: any) => {
        return { ...result, processedBy2: true };
      },
    };

    const chain = new ToolExecutionGuardChain([mockGuard1, mockGuard2]);
    const initialContext: any = {};
    const toolResult: any = { data: "test" };

    const result = await chain.execute(initialContext, toolResult);

    expect(result).toEqual({ data: "test", processedBy1: true, processedBy2: true });
  });

  it("should handle execution failure in preExecute by throwing the error", async () => {
    const failingGuard: Guard<any, any> = {
      preExecute: async (context: any) => {
        throw new Error("Pre-execution failed");
      },
      postExecute: async (result: any) => result,
    };
    const chain = new ToolExecutionGuardChain([failingGuard]);
    const initialContext: any = {};
    const toolResult: any = {};

    await expect(async () => {
      await chain.execute(initialContext, toolResult);
    }).rejects.toThrow("Pre-execution failed");
  });
});