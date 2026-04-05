import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChainExecutor } from "../src/preconditions/tool-call-precondition-chain-executor";
import { Message } from "../src/preconditions/types";

describe("ToolCallPreconditionChainExecutor", () => {
  it("should execute all registered precondition checkers and return overall success status", async () => {
    const mockChecker1: (context: Message) => Promise<any> = async () => ({ success: true, message: "Checker 1 passed" });
    const mockChecker2: (context: Message) => Promise<any> = async () => ({ success: true, message: "Checker 2 passed" });

    const executor = new ToolCallPreconditionChainExecutor();
    (executor as any).addChecker({ name: "Checker1", checker: mockChecker1 });
    (executor as any).addChecker({ name: "Checker2", checker: mockChecker2 });

    const context: Message = { role: "user", content: "Test context" };
    const result = await (executor as any).execute(context);

    expect(result.overallSuccess).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results.map(r => r.checkerName)).toEqual(["Checker1", "Checker2"]);
  });

  it("should correctly report overall failure if any precondition checker fails", async () => {
    const mockChecker1: (context: Message) => Promise<any> = async () => ({ success: true, message: "Checker 1 passed" });
    const mockChecker2: (context: Message) => Promise<any> = async () => ({ success: false, message: "Checker 2 failed" });

    const executor = new ToolCallPreconditionChainExecutor();
    (executor as any).addChecker({ name: "Checker1", checker: mockChecker1 });
    (executor as any).addChecker({ name: "Checker2", checker: mockChecker2 });

    const context: Message = { role: "user", content: "Test context" };
    const result = await (executor as any).execute(context);

    expect(result.overallSuccess).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results.find(r => r.checkerName === "Checker2")?.result.success).toBe(false);
  });

  it("should handle an empty set of checkers gracefully", async () => {
    const executor = new ToolCallPreconditionChainExecutor();

    const context: Message = { role: "user", content: "Empty test" };
    const result = await (executor as any).execute(context);

    expect(result.overallSuccess).toBe(true);
    expect(result.results).toHaveLength(0);
  });
});