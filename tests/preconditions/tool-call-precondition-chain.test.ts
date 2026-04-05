import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChain } from "../src/preconditions/tool-call-precondition-chain";

describe("ToolCallPreconditionChain", () => {
  it("should return success if all checkers pass", () => {
    const mockChecker1: any = {
      check: jest.fn(() => ({ success: true, message: "OK" })),
    };
    const mockChecker2: any = {
      check: jest.fn(() => ({ success: true, message: "OK" })),
    };
    const chain = new ToolCallPreconditionChain([mockChecker1, mockChecker2]);
    const result = chain.check({ name: "tool1" }, {});
    expect(result.success).toBe(true);
    expect(mockChecker1.check).toHaveBeenCalledTimes(1);
    expect(mockChecker2.check).toHaveBeenCalledTimes(1);
  });

  it("should return failure with the message of the first failing checker", () => {
    const mockChecker1: any = {
      check: jest.fn(() => ({ success: false, message: "Error 1" })),
    };
    const mockChecker2: any = {
      check: jest.fn(() => ({ success: false, message: "Error 2" })),
    };
    const chain = new ToolCallPreconditionChain([mockChecker1, mockChecker2]);
    const result = chain.check({ name: "tool1" }, {});
    expect(result.success).toBe(false);
    expect(result.message).toBe("Error 1");
    expect(mockChecker1.check).toHaveBeenCalledTimes(1);
    expect(mockChecker2.check).not.toHaveBeenCalled();
  });

  it("should return success if there are no checkers", () => {
    const chain = new ToolCallPreconditionChain([]);
    const result = chain.check({ name: "tool1" }, {});
    expect(result.success).toBe(true);
    expect(result.message).toBe("");
  });
});