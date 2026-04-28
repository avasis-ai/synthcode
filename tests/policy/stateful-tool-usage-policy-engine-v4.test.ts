import { describe, it, expect } from "vitest";
import { PolicyEngineV4, PolicyState, ToolUseBlock } from "../src/policy/stateful-tool-usage-policy-engine-v4";

describe("PolicyEngineV4", () => {
  it("should allow tool use when within quota limits", () => {
    const initialState: PolicyState = {
      tool_calls_count: 1,
      total_cost: 10,
      session_context: {
        message_history: [],
        tool_uses: [],
      },
    };
    const toolUse: ToolUseBlock = {
      tool_name: "search",
      arguments: { query: "test" },
    };
    const context = { messageHistory: [], toolUses: [] };

    const result = PolicyEngineV4.check(initialState, toolUse, context);

    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("within quota");
    expect(result.newState).toEqual({
      tool_calls_count: 2,
      total_cost: 10,
      session_context: {
        message_history: [],
        tool_uses: [{ tool_name: "search", arguments: { query: "test" } }],
      },
    });
  });

  it("should deny tool use when exceeding max_calls_in_session", () => {
    const initialState: PolicyState = {
      tool_calls_count: 5,
      total_cost: 50,
      session_context: {
        message_history: [],
        tool_uses: [],
      },
    };
    const toolUse: ToolUseBlock = {
      tool_name: "search",
      arguments: { query: "test" },
    };
    const context = { messageHistory: [], toolUses: [] };

    const result = PolicyEngineV4.check(initialState, toolUse, context);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exceeding max tool calls");
    expect(result.newState).toEqual(initialState);
  });

  it("should deny tool use when total_cost exceeds session limit", () => {
    const initialState: PolicyState = {
      tool_calls_count: 1,
      total_cost: 95,
      session_context: {
        message_history: [],
        tool_uses: [],
      },
    };
    const toolUse: ToolUseBlock = {
      tool_name: "search",
      arguments: { query: "expensive" },
    };
    const context = { messageHistory: [], toolUses: [] };

    const result = PolicyEngineV4.check(initialState, toolUse, context);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("exceeding total cost");
    expect(result.newState).toEqual(initialState);
  });
});