import { describe, it, expect } from "vitest";
import {
  PolicyEngineV5,
  StateContext,
  PolicyAction,
  PolicyResult,
} from "../src/policy/stateful-tool-usage-policy-engine-v5";

describe("PolicyEngineV5", () => {
  it("should allow initial message when context is empty", async () => {
    const context: StateContext = {
      history: [],
      sessionStartTime: Date.now(),
      toolUsageCounts: {},
      contextKeywords: new Set(),
    };
    const result = await PolicyEngineV5.evaluate(
      context,
      "Hello world",
      "user"
    );
    expect(result.action).toBe(PolicyAction.ALLOW);
    expect(result.message).toContain("No policy violation");
  });

  it("should deny usage if a tool has exceeded its usage limit", async () => {
    const context: StateContext = {
      history: [
        {
          role: "user",
          content: "Use toolA",
          timestamp: Date.now() - 1000,
          toolName: "toolA",
        },
        {
          role: "assistant",
          content: "Tool result for toolA",
          timestamp: Date.now(),
          toolName: "toolA",
        },
      ],
      sessionStartTime: Date.now(),
      toolUsageCounts: {
        toolA: { count: 2, lastUsed: Date.now() - 1000 },
        toolB: { count: 1, lastUsed: Date.now() },
      },
      contextKeywords: new Set(["important"]),
    };
    const result = await PolicyEngineV5.evaluate(
      context,
      "Use toolA again",
      "user",
      "toolA"
    );
    expect(result.action).toBe(PolicyAction.DENY);
    expect(result.message).toContain("toolA usage limit exceeded");
  });

  it("should warn if the user tries to use a tool not mentioned in context keywords", async () => {
    const context: StateContext = {
      history: [
        {
          role: "user",
          content: "Discuss important topics.",
          timestamp: Date.now() - 1000,
          toolName: undefined,
        },
      ],
      sessionStartTime: Date.now(),
      toolUsageCounts: {
        toolA: { count: 1, lastUsed: Date.now() - 1000 },
      },
      contextKeywords: new Set(["important"]),
    };
    const result = await PolicyEngineV5.evaluate(
      context,
      "Use toolC",
      "user",
      "toolC"
    );
    expect(result.action).toBe(PolicyAction.WARN);
    expect(result.message).toContain("toolC is not related to context keywords");
  });
});