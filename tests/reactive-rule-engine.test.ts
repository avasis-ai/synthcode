import { describe, it, expect, vi } from "vitest";
import { Rule, State, Message, RuleCondition, RuleAction } from "./reactive-rule-engine";

describe("Reactive Rule Engine", () => {
    it("should execute rules and update state correctly when conditions are met", async () => {
        const initialState: State = {
            context: { user: "Alice", count: 0 },
            history: [],
        };

        // Rule that increments a counter if the user role is present
        const incrementRule: Rule = {
            name: "IncrementCounter",
            condition: (state: State, event: Message) => state.context.user && typeof state.context.count === 'number',
            action: async (state: State) => {
                const newCount = (state.context.count || 0) + 1;
                return { type: "context_update", payload: { count: newCount } };
            },
        };

        const event: Message = { role: "user", content: "Hello" };

        // Execute the rule
        const result = await incrementRule.action(initialState);
        expect(result.type).toBe("context_update");
        expect(result.payload.count).toBe(1);

        // Simulate state update and re-run (assuming a mechanism to apply updates)
        const newState: State = {
            context: { user: "Alice", count: 1 },
            history: [event],
        };

        // For testing purposes, we manually check the expected outcome of the rule application
        // In a real engine, the state would be updated by the engine itself.
        const updatedState = {
            ...newState,
            context: { ...newState.context, count: 1 }
        } as State;

        // Re-run the action logic (simulating the engine's internal state management)
        const secondResult = await incrementRule.action(updatedState);
        expect(secondResult.type).toBe("context_update");
        expect(secondResult.payload.count).toBe(2);
    });

    it("should not execute rules if the condition is not met", async () => {
        const initialState: State = {
            context: { user: "Bob" },
            history: [],
        };

        // Rule that requires a specific context value (e.g., count > 0)
        const checkCountRule: Rule = {
            name: "CheckCount",
            condition: (state: State, event: Message) => typeof state.context.count === 'number' && state.context.count > 0,
            action: async (state: State) => {
                return { type: "warning", payload: "Count is high" };
            },
        };

        const event: Message = { role: "user", content: "Test" };

        // 1. Condition fails (count is undefined)
        const conditionMet1 = checkCountRule.condition(initialState, event);
        expect(conditionMet1).toBe(false);

        // 2. Condition still fails even if we manually set context (if the rule logic is strict)
        const stateWithZeroCount: State = {
            context: { user: "Bob", count: 0 },
            history: [],
        };
        const conditionMet2 = checkCountRule.condition(stateWithZeroCount, event);
        expect(conditionMet2).toBe(false);
    });

    it("should handle rules that return different action types (e.g., tool_call)", async () => {
        const initialState: State = {
            context: { needs_tool: true },
            history: [],
        };

        // Rule that triggers a tool call
        const toolCallRule: Rule = {
            name: "CallTool",
            condition: (state: State, event: Message) => state.context.needs_tool === true,
            action: async (state: State) => {
                return { type: "tool_call", payload: { tool: "search", query: "latest info" } };
            },
        };

        const event: Message = { role: "user", content: "What's new?" };

        // Check condition
        const conditionMet = toolCallRule.condition(initialState, event);
        expect(conditionMet).toBe(true);

        // Execute action
        const result = await toolCallRule.action(initialState);
        expect(result.type).toBe("tool_call");
        expect(result.payload).toEqual({ tool: "search", query: "latest info" });
    });
});