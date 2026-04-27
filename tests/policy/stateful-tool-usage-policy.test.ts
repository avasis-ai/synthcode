import { describe, it, expect } from "vitest";
import { PolicyEngine } from "../src/policy/stateful-tool-usage-policy";

describe("PolicyEngine", () => {
  it("should allow tool usage when history is empty and call count is 0", () => {
    const engine = new PolicyEngine();
    const context = {
      history: [],
      currentToolUse: {
        toolName: "testTool",
        callId: "call1",
      },
    };
    const history = {
      messages: [],
      toolCallCounts: {},
    };
    const result = engine.evaluatePolicy(
      context,
      history,
      "testTool",
      0
    );
    expect(result.allowed).toBe(true);
  });

  it("should disallow tool usage if the tool has exceeded its allowed call limit", () => {
    const engine = new PolicyEngine();
    const context = {
      history: [{
        role: "user",
        content: "Use tool A",
      }],
      currentToolUse: {
        toolName: "limitedTool",
        callId: "call2",
      },
    };
    const history = {
      messages: [{
        role: "user",
        content: "Use tool A",
      }],
      toolCallCounts: {
        limitedTool: 2,
      },
    };
    const result = engine.evaluatePolicy(
      context,
      history,
      "limitedTool",
      2
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exceeded its allowed call limit");
  });

  it("should allow tool usage if the tool is within its allowed call limit", () => {
    const engine = new PolicyEngine();
    const context = {
      history: [{
        role: "user",
        content: "Use tool A",
      }],
      currentToolUse: {
        toolName: "testTool",
        callId: "call3",
      },
    };
    const history = {
      messages: [{
        role: "user",
        content: "Use tool A",
      }],
      toolCallCounts: {
        testTool: 1,
      },
    };
    const result = engine.evaluatePolicy(
      context,
      history,
      "testTool",
      1
    );
    expect(result.allowed).toBe(true);
  });
});