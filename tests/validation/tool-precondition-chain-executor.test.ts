import { describe, it, expect } from "vitest";
import { PreconditionExecutor } from "../src/validation/tool-precondition-chain-executor";

describe("PreconditionExecutor", () => {
  it("should return success if all preconditions pass", async () => {
    const mockPrecondition1: PreconditionFunction = async (context) => ({ success: true });
    const mockPrecondition2: PreconditionFunction = async (context) => ({ success: true });

    const executor = new PreconditionExecutor();
    const result = await executor.executeChain([mockPrecondition1, mockPrecondition2], {});

    expect(result.success).toBe(true);
    expect(result.failedPreconditionIndex).toBe(-1);
  });

  it("should stop and report failure on the first failing precondition", async () => {
    const mockPrecondition1: PreconditionFunction = async (context) => ({ success: true });
    const mockPrecondition2: PreconditionFunction = async (context) => ({ success: false, error: "Invalid input" });
    const mockPrecondition3: PreconditionFunction = async (context) => ({ success: true });

    const executor = new PreconditionExecutor();
    const result = await executor.executeChain([mockPrecondition1, mockPrecondition2, mockPrecondition3], {});

    expect(result.success).toBe(false);
    expect(result.failedPreconditionIndex).toBe(1);
    expect(result.failureReport.precondition).toBe(mockPrecondition2);
  });

  it("should handle an empty chain of preconditions gracefully", async () => {
    const executor = new PreconditionExecutor();
    const result = await executor.executeChain([], {});

    expect(result.success).toBe(true);
    expect(result.failedPreconditionIndex).toBe(-1);
  });
});