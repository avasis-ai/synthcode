import { describe, it, expect } from "vitest";
import { ToolCallPreconditionChecker } from "../src/preconditions/tool-call-precondition-checker";
import { ToolCall, ToolInvocationContext } from "../src/preconditions/types";

describe("ToolCallPreconditionChecker", () => {
  it("should return success true and no errors if all preconditions pass", async () => {
    const mockContext: ToolInvocationContext = {
      toolCalls: [{ id: "call1", name: "toolA", arguments: {} }],
      // Add other necessary context properties if the actual implementation relies on them
    };

    const passesPrecondition: Precondition = async (context) => {
      return true;
    };

    const checker = new ToolCallPreconditionChecker([passesPrecondition]);
    const result = await checker.check({ id: "call1", name: "toolA", arguments: {} }, mockContext);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return success false and collect all errors if any precondition fails", async () => {
    const mockContext: ToolInvocationContext = {
      toolCalls: [{ id: "call1", name: "toolA", arguments: {} }],
    };

    const failingPrecondition: Precondition = async (context) => {
      throw new Error("Precondition A failed");
    };

    const passingPrecondition: Precondition = async (context) => {
      return true;
    };

    const checker = new ToolCallPreconditionChecker([failingPrecondition, passingPrecondition]);
    const result = await checker.check({ id: "call1", name: "toolA", arguments: {} }, mockContext);

    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBeInstanceOf(Error);
    expect(result.errors[0]!.message).toBe("Precondition A failed");
  });

  it("should handle an empty list of preconditions gracefully", async () => {
    const mockContext: ToolInvocationContext = {
      toolCalls: [],
    };

    const checker = new ToolCallPreconditionChecker([]);
    const result = await checker.check({ id: "call1", name: "toolA", arguments: {} }, mockContext);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});