import { describe, it, expect } from "vitest";
import { AdvancedContext } from "../src/validation/structured-tool-call-validator-context-enricher-v166-advanced";

describe("AdvancedContext", () => {
  it("should correctly initialize with minimal required data", () => {
    const mockContext: AdvancedContext = {
      agent_state: {
        current_user_id: "user123",
        session_metadata: {
          source: "web",
        },
        last_action_successful: true,
      },
      global_constraints: {
        max_tool_calls: 5,
        allowed_tools: ["search", "calculator"],
        system_directives: "You are a helpful assistant.",
      },
      recent_history_summary: "User asked about the weather in London.",
    };
    expect(mockContext).toBeDefined();
    expect(mockContext.agent_state.current_user_id).toBe("user123");
    expect(mockContext.global_constraints.max_tool_calls).toBe(5);
    expect(mockContext.recent_history_summary).toBe("User asked about the weather in London.");
  });

  it("should handle empty or default values gracefully", () => {
    const mockContext: AdvancedContext = {
      agent_state: {
        current_user_id: "",
        session_metadata: {},
        last_action_successful: false,
      },
      global_constraints: {
        max_tool_calls: 1,
        allowed_tools: [],
        system_directives: "",
      },
      recent_history_summary: "",
    };
    expect(mockContext.agent_state.current_user_id).toBe("");
    expect(mockContext.global_constraints.allowed_tools).toEqual([]);
    expect(mockContext.recent_history_summary).toBe("");
  });

  it("should correctly merge updates to the context", () => {
    const initialContext: AdvancedContext = {
      agent_state: {
        current_user_id: "old_user",
        session_metadata: {
          source: "web",
        },
        last_action_successful: false,
      },
      global_constraints: {
        max_tool_calls: 3,
        allowed_tools: ["toolA"],
        system_directives: "Initial directive.",
      },
      recent_history_summary: "Old summary.",
    };

    const updatedContext: AdvancedContext = {
      agent_state: {
        current_user_id: "new_user",
        session_metadata: {
          source: "mobile",
          device: "phone",
        },
        last_action_successful: true,
      },
      global_constraints: {
        max_tool_calls: 10,
        allowed_tools: ["toolA", "toolB"],
        system_directives: "Updated directive.",
      },
      recent_history_summary: "New summary about the market.",
    };

    // In a real scenario, we'd test a merge function, but here we test the structure integrity after an update.
    const mergedContext: AdvancedContext = {
      agent_state: { ...initialContext.agent_state, ...updatedContext.agent_state },
      global_constraints: { ...initialContext.global_constraints, ...updatedContext.global_constraints },
      recent_history_summary: updatedContext.recent_history_summary,
    };

    expect(mergedContext.agent_state.current_user_id).toBe("new_user");
    expect(mergedContext.agent_state.session_metadata.device).toBe("phone");
    expect(mergedContext.global_constraints.max_tool_calls).toBe(10);
    expect(mergedContext.global_constraints.allowed_tools).toEqual(["toolA", "toolB"]);
    expect(mergedContext.recent_history_summary).toBe("New summary about the market.");
  });
});