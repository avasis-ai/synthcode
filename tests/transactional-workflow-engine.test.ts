import { describe, it, expect } from "vitest";
import { runWorkflow } from "./transactional-workflow-engine";

describe("runWorkflow", () => {
    it("should successfully execute a simple linear workflow", async () => {
        const workflow = [
            {
                type: "tool_use",
                tool_name: "get_user_profile",
                input: { userId: "user123" },
            },
            {
                type: "tool_use",
                tool_name: "get_order_history",
                input: { userId: "user123" },
            },
        ];

        const result = await runWorkflow(workflow, {
            tools: {
                get_user_profile: async (input) => ({
                    user: "John Doe",
                    email: "john@example.com",
                }),
                get_order_history: async (input) => ([
                    { orderId: "O1", total: 100 },
                    { orderId: "O2", total: 50 },
                ]),
            },
        });

        expect(result).toEqual([
            {
                role: "tool",
                tool_use_id: "call_get_user_profile",
                content: { user: "John Doe", email: "john@example.com" },
            },
            {
                role: "tool",
                tool_use_id: "call_get_order_history",
                content: [
                    { orderId: "O1", total: 100 },
                    { orderId: "O2", total: 50 },
                ],
            },
        ]);
    });

    it("should handle a workflow that requires sequential tool calls and aggregation", async () => {
        const workflow = [
            {
                type: "tool_use",
                tool_name: "get_user_profile",
                input: { userId: "user456" },
            },
            {
                type: "tool_use",
                tool_name: "calculate_total_spent",
                input: { userId: "user456" },
            },
        ];

        const mockTools = {
            get_user_profile: async (input) => ({
                userId: input.userId,
                name: "Jane Smith",
                email: "jane@example.com",
            }),
            calculate_total_spent: async (input) => {
                // Simulate using the result of get_user_profile (though the current engine structure might not support direct chaining, we test the execution flow)
                return { totalSpent: 1500, currency: "USD" };
            },
        };

        const result = await runWorkflow(workflow, {
            tools: mockTools,
        });

        expect(result).toHaveLength(2);
        expect(result[0].role).toBe("tool");
        expect(result[0].tool_use_id).toBe("call_get_user_profile");
        expect(result[0].content).toEqual({
            userId: "user456",
            name: "Jane Smith",
            email: "jane@example.com",
        });
        expect(result[1].role).toBe("tool");
        expect(result[1].tool_use_id).toBe("call_calculate_total_spent");
        expect(result[1].content).toEqual({ totalSpent: 1500, currency: "USD" });
    });

    it("should return an empty array if the workflow is empty", async () => {
        const workflow: any[] = [];

        const result = await runWorkflow(workflow, {
            tools: {},
        });

        expect(result).toEqual([]);
    });
});